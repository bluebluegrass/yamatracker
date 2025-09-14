import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Lightweight types (kept local to the route to avoid cross-file churn)
type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };
type Preferences = {
  regions?: string[]; // e.g., ['関東']
  difficulty?: string[]; // e.g., ['★','★★']
  season?: 'spring' | 'summer' | 'autumn' | 'winter' | null;
};
type ChatRequest = {
  locale: 'en' | 'ja' | 'zh';
  completed_ids?: string[];
  preferences?: Preferences;
  messages: ChatMessage[];
};

type MountainCandidate = {
  id: string;
  name_en: string;
  name_ja: string;
  name_zh: string;
  region: string;
  prefecture: string | null;
  difficulty: string | null;
  elevation_m: number | null;
};

// --- Basic in-memory rate limiting (MVP) ---
const rlStore = new Map<string, { count: number; reset: number }>();
const RL_WINDOW_MS = 60_000; // 1 minute window
const RL_MAX = 10; // up to 10 requests per window per key

function rateLimitCheck(key: string, now = Date.now()) {
  let entry = rlStore.get(key);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + RL_WINDOW_MS };
    rlStore.set(key, entry);
  }
  if (entry.count >= RL_MAX) {
    return { allowed: false, resetMs: Math.max(0, entry.reset - now), remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, resetMs: Math.max(0, entry.reset - now), remaining: Math.max(0, RL_MAX - entry.count) };
}

// --- Minimal server logging (no PII) ---
function getClientIp(req: NextRequest): string {
  const ipHeader = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  return (ipHeader.split(',')[0] || '').trim() || 'unknown';
}

function logEvent(event: {
  status: string;
  ip?: string;
  locale?: 'en' | 'ja' | 'zh';
  completed_ids_length?: number;
  candidates_count?: number;
  suggestions_count?: number;
  duration_ms?: number;
  error?: string;
}) {
  try {
    // Keep log concise and structured; avoid user text/PII.
    console.log('[chat_api]', {
      t: new Date().toISOString(),
      ...event,
    });
  } catch {
    // Swallow logging errors
  }
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0; // 32-bit
  }
  return h;
}

async function getCandidates(
  completed: string[],
  prefs?: Preferences,
  limit = 20,
  seed?: string,
  heuristics?: { nearTokyo?: boolean; nearOsaka?: boolean; season?: 'spring' | 'summer' | 'autumn' | 'winter'; difficultyStars?: string[]; regions?: string[] }
): Promise<MountainCandidate[]> {
  // Fetch a compact set of fields; dataset is small (100 rows)
  const { data, error } = await supabaseAdmin
    .from('mountains')
    .select('id,name_en,name_ja,name_zh,region,prefecture,difficulty,elevation_m')
    .order('id');

  if (error) {
    throw error;
  }

  const completedSet = new Set(completed);
  let rows = (data ?? []) as MountainCandidate[];

  // Exclude already completed
  rows = rows.filter((m) => !completedSet.has(m.id));

  // Apply simple preference filters if provided
  if (prefs?.regions && prefs.regions.length) {
    const allowed = new Set(prefs.regions);
    rows = rows.filter((m) => allowed.has(m.region));
  }
  if (prefs?.difficulty && prefs.difficulty.length) {
    const allowed = new Set(prefs.difficulty);
    rows = rows.filter((m) => (m.difficulty ? allowed.has(m.difficulty) : false));
  }

  // Heuristic filters inferred from free text (with graded fallbacks)
  const baseRows = rows;
  let rowsAfterGeo = rows;
  if (heuristics?.nearTokyo) {
    // Approximate 3h drive from Shinjuku by prefecture
    const near = new Set([
      '東京', '神奈川', '埼玉', '千葉',
      '山梨', '静岡', '群馬', '栃木', '茨城', '長野'
    ]);
    const normalizeTokens = (pref: string): string[] => {
      // Split by common separators and trim
      const parts = pref.replace(/・|／|\/|、/g, ',').split(',');
      const out: string[] = [];
      for (let p of parts) {
        p = p.trim();
        if (!p) continue;
        // Remove suffixes like 東京都/神奈川県/大阪府/北海道
        p = p.replace(/(都|道|府|県)$/u, '');
        out.push(p);
      }
      return out;
    };
    rowsAfterGeo = rows.filter((m) => {
      if (!m.prefecture) return false;
      const tokens = normalizeTokens(m.prefecture);
      return tokens.some((t) => near.has(t));
    });
    rows = rowsAfterGeo;
  }
  if (heuristics?.nearOsaka) {
    // Approximate <=2h shinkansen from Osaka (Kansai core + nearby)
    const near = new Set([
      '大阪', '兵庫', '京都', '奈良', '滋賀', '和歌山',
      '三重', '岐阜', '愛知', '静岡', // 東海方面
      '岡山', '広島' // 中国地方（新大阪→広島 ~1h20）
    ]);
    const normalizeTokens = (pref: string): string[] => {
      const parts = pref.replace(/・|／|\\/g, ',').split(',');
      const out: string[] = [];
      for (let p of parts) {
        p = p.trim();
        if (!p) continue;
        p = p.replace(/(都|道|府|県)$/u, '');
        out.push(p);
      }
      return out;
    };
    const filtered = rows.filter((m) => {
      if (!m.prefecture) return false;
      const tokens = normalizeTokens(m.prefecture);
      return tokens.some((t) => near.has(t));
    });
    rowsAfterGeo = filtered.length ? filtered : rowsAfterGeo;
    rows = rowsAfterGeo;
  }
  let rowsAfterSeason = rows;
  if (heuristics?.season === 'winter') {
    // Prefer lower elevation in winter to avoid alpine hazards
    rowsAfterSeason = rows.filter((m) => typeof m.elevation_m === 'number' ? m.elevation_m <= 2500 : true);
    rows = rowsAfterSeason;
  }
  let rowsAfterDifficulty = rows;
  if (heuristics?.difficultyStars && heuristics.difficultyStars.length) {
    const allowed = new Set(heuristics.difficultyStars);
    rowsAfterDifficulty = rows.filter((m) => (m.difficulty ? allowed.has(m.difficulty) : false));
    rows = rowsAfterDifficulty;
  }

  // Region as hard constraint if present
  if (heuristics?.regions && heuristics.regions.length) {
    const allowedRegions = new Set(heuristics.regions);
    const regionFiltered = rows.filter((m) => allowedRegions.has(m.region));
    rows = regionFiltered;
  }

  // If heuristics made the pool empty, degrade constraints in order: difficulty -> season -> geo -> base
  if (rows.length === 0) {
    // If region was specified, keep region strict: try removing difficulty first, then season, then geo, always reapplying region
    if (heuristics?.regions && heuristics.regions.length) {
      const allowedRegions = new Set(heuristics.regions);
      const dropDifficulty = rowsAfterSeason.filter((m) => allowedRegions.has(m.region));
      if (dropDifficulty.length) {
        rows = dropDifficulty;
      } else {
        const dropSeason = rowsAfterGeo.filter((m) => allowedRegions.has(m.region));
        if (dropSeason.length) {
          rows = dropSeason;
        } else {
          const baseRegion = baseRows.filter((m) => allowedRegions.has(m.region));
          rows = baseRegion; // may still be empty; we keep region strict
        }
      }
    } else {
      rows = rowsAfterSeason.length ? rowsAfterSeason : rowsAfterGeo.length ? rowsAfterGeo : baseRows;
    }
  }

  // Deterministic rotation of candidates based on seed (e.g., last user message)
  const capped = Math.max(1, Math.min(50, limit));
  if (rows.length <= capped) return rows;
  if (seed && rows.length > 0) {
    const offset = Math.abs(hashString(seed)) % rows.length;
    const rotated = rows.slice(offset).concat(rows.slice(0, offset));
    return rotated.slice(0, capped);
  }
  // Fallback: take first N (stable)
  return rows.slice(0, capped);
}

function buildSystemPrompt(locale: 'en' | 'ja' | 'zh') {
  const lang = locale === 'ja' ? 'Japanese' : locale === 'zh' ? 'Chinese' : 'English';
  return [
    {
      role: 'system' as const,
      content:
        `You are "Japan Mountain Guide", helping users pick their next mountain from a provided candidate list.\n` +
        `Rules:\n` +
        `- ONLY recommend mountains by their id from the provided candidates.\n` +
        `- Use ONLY the fields provided for candidates (id, names, region, prefecture, difficulty, elevation). Do NOT assume facilities, camping permission, access, or safety if not provided.\n` +
        `- If the user requests winter camping or facilities and you cannot reliably infer suitability from the provided fields, return an empty suggestions list with a short follow-up asking to adjust filters or choose a different season/region.\n` +
        `- Return STRICT JSON only (no prose) with shape: {\n` +
        `  "suggestions": [{"mountain_id": string, "title": string, "reason": string}],\n` +
        `  "followups"?: string[],\n` +
        `  "disclaimer"?: string\n` +
        `}.\n` +
        `- Maximum 3 suggestions. Be concise.\n` +
        `- Write responses in ${lang}.\n`
    },
  ];
}

function buildUserPrompt(
  userMessages: ChatMessage[],
  candidates: MountainCandidate[],
  locale: 'en' | 'ja' | 'zh',
  completedCount: number,
  seasonHint?: 'spring' | 'summer' | 'autumn' | 'winter',
  difficultyHint?: string[],
  regionHint?: string[]
) {
  const lastText = userMessages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  const userText = String(lastText).slice(0, 2000);
  const compactCandidates = candidates.map(c => ({
    id: c.id,
    name_en: c.name_en,
    prefecture: c.prefecture,
    region: c.region,
    difficulty: c.difficulty,
    elevation_m: c.elevation_m,
  }));
  const content =
    `Locale: ${locale}\n` +
    `Completed count: ${completedCount}\n` +
    (seasonHint ? `Season hint: ${seasonHint}\n` : '') +
    (difficultyHint && difficultyHint.length ? `Difficulty hint: ${difficultyHint.join(',')}\n` : '') +
    (regionHint && regionHint.length ? `Region hint: ${regionHint.join(',')}\n` : '') +
    `Candidates (choose from these ids only):\n` +
    JSON.stringify(compactCandidates) +
    `\n\nUser request (latest message only):\n${userText}\n` +
    `Return JSON only.`;
  return [{ role: 'user' as const, content }];
}

function inferHeuristicsFromText(text: string): { nearTokyo?: boolean; season?: 'spring' | 'summer' | 'autumn' | 'winter'; difficultyStars?: string[]; regions?: string[] } {
  const t = (text || '').toLowerCase();
  const nearTokyo = /新宿|東京|tokyo|shinjuku/.test(t) && /(3\s*个?小时|3\s*hours|三小时)/.test(t);
  const nearOsaka = /大阪|osaka/.test(t) && /(新干线|shinkansen|新幹線)/.test(t);
  // Month to season (rough)
  let season: 'spring' | 'summer' | 'autumn' | 'winter' | undefined = undefined;
  if (/春|spring|3月|4月|5月/.test(t)) season = 'spring';
  if (/夏|summer|6月|7月|8月/.test(t)) season = 'summer';
  if (/秋|autumn|fall|9月|10月|11月/.test(t)) season = 'autumn';
  if (/冬|winter|12月|1月|2月/.test(t)) season = 'winter';
  // Difficulty stars detection (Chinese and glyphs)
  const stars: string[] = [];
  if (/★★★★★|5\s*星|五星/.test(t)) stars.push('★★★★★');
  if (/★★★★|4\s*星|四星/.test(t)) stars.push('★★★★');
  if (/★★★|3\s*星|三星/.test(t)) stars.push('★★★');
  if (/★★|2\s*星|二星|两星/.test(t)) stars.push('★★');
  if (/★(?!★)/.test(t) || /1\s*星|一星/.test(t)) stars.push('★');
  // Region detection (Chinese/English/Japanese) mapped to dataset labels
  const regionHints: string[] = [];
  const add = (s: string) => { if (!regionHints.includes(s)) regionHints.push(s); };
  if (/九州|kyushu/.test(t)) add('九州');
  if (/北海道|hokkaido/.test(t)) add('北海道');
  if (/東北|东北|tohoku/.test(t)) add('東北');
  if (/関東|关东|kanto/.test(t)) add('関東');
  if (/中部|chubu/.test(t)) add('中部');
  if (/関西|关西|kansai/.test(t)) add('関西');
  if (/(中国地方|中国地区|\bchugoku\b)/.test(t)) add('中国');
  if (/四国|shikoku/.test(t)) add('四国');
  return { nearTokyo, nearOsaka, season, difficultyStars: stars.length ? stars : undefined, regions: regionHints.length ? regionHints : undefined };
}

async function callOpenAIJSON(messages: { role: 'system' | 'user' | 'assistant'; content: string }[], apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`OpenAI HTTP ${res.status}: ${text}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    return typeof content === 'string' ? content : '';
  } finally {
    clearTimeout(timeout);
  }
}

type ModelSuggestion = { mountain_id: string; title?: string; reason?: string };
type ModelResponse = { suggestions?: ModelSuggestion[]; followups?: string[]; disclaimer?: string };

function safeParseModel(content: string): ModelResponse | null {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') return null;
    const suggestionsRaw = Array.isArray((parsed as any).suggestions) ? (parsed as any).suggestions : [];
    const suggestions: ModelSuggestion[] = [];
    for (const s of suggestionsRaw) {
      if (!s || typeof s !== 'object') continue;
      const id = typeof (s as any).mountain_id === 'string' ? (s as any).mountain_id.slice(0, 32) : null;
      if (!id) continue;
      const title = typeof (s as any).title === 'string' ? (s as any).title.slice(0, 120) : undefined;
      const reason = typeof (s as any).reason === 'string' ? (s as any).reason.slice(0, 600) : undefined;
      suggestions.push({ mountain_id: id, title, reason });
      if (suggestions.length >= 3) break;
    }
    const followups = Array.isArray((parsed as any).followups)
      ? (parsed as any).followups.filter((x: any) => typeof x === 'string').slice(0, 5)
      : undefined;
    const disclaimer = typeof (parsed as any).disclaimer === 'string' ? (parsed as any).disclaimer.slice(0, 200) : undefined;
    return { suggestions, followups, disclaimer };
  } catch {
    return null;
  }
}

function clampString(input: unknown, max = 1000): string | null {
  if (typeof input !== 'string') return null;
  return input.length > max ? input.slice(0, max) : input;
}

function isLocale(x: unknown): x is 'en' | 'ja' | 'zh' {
  return x === 'en' || x === 'ja' || x === 'zh';
}

function validateArrayOfStrings(x: unknown, maxItems = 50, maxLen = 64): string[] | null {
  if (!Array.isArray(x)) return null;
  const out: string[] = [];
  for (const v of x) {
    if (typeof v !== 'string') continue;
    const s = v.slice(0, maxLen);
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

function validateMessages(x: unknown, maxItems = 10, maxLen = 1000): ChatMessage[] | null {
  if (!Array.isArray(x)) return null;
  const out: ChatMessage[] = [];
  for (const m of x) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as any).role;
    const content = clampString((m as any).content, maxLen);
    if (!content) continue;
    if (role !== 'user' && role !== 'assistant' && role !== 'system') continue;
    out.push({ role, content });
    if (out.length >= maxItems) break;
  }
  return out.length ? out : null;
}

function validatePreferences(x: unknown): Preferences | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const regions = validateArrayOfStrings((x as any).regions, 8, 32) ?? undefined;
  const difficultyRaw = validateArrayOfStrings((x as any).difficulty, 4, 4) ?? undefined;
  const allowedStars = new Set(['★', '★★', '★★★', '★★★★', '★★★★★']);
  const difficulty = difficultyRaw?.filter((d) => allowedStars.has(d)) ?? undefined;
  const season = ((): Preferences['season'] => {
    const val = (x as any).season;
    return val === 'spring' || val === 'summer' || val === 'autumn' || val === 'winter' || val === null
      ? val
      : undefined;
  })();
  return { regions, difficulty, season };
}

// POST /api/chat — scaffold only (no OpenAI call yet)
export async function POST(request: NextRequest) {
  const started = Date.now();
  // Server-only env guard
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logEvent({ status: 'error:no_api_key', ip: getClientIp(request), duration_ms: Date.now() - started });
    return NextResponse.json(
      { success: false, error: 'Server missing OPENAI_API_KEY' },
      { status: 500 }
    );
  }

  // Parse body (no validation yet — added in next step)
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // Ignore parse errors; respond with 400 below
  }

  // Input validation (minimal, dependency-free)
  const locale = isLocale((body as any)?.locale) ? (body as any).locale : 'en';
  const messages = validateMessages((body as any)?.messages);
  if (!messages) {
    logEvent({ status: 'error:invalid_messages', ip: getClientIp(request), duration_ms: Date.now() - started });
    return NextResponse.json(
      { success: false, error: 'Invalid messages' },
      { status: 400 }
    );
  }
  const completed_ids = validateArrayOfStrings((body as any)?.completed_ids, 200, 32) ?? [];
  const preferences = validatePreferences((body as any)?.preferences);

  // Rate limiting (per IP for MVP)
  const ip = getClientIp(request);
  const rl = rateLimitCheck(`ip:${ip}`);
  if (!rl.allowed) {
    logEvent({ status: 'error:rate_limited', ip, locale, completed_ids_length: completed_ids.length, duration_ms: Date.now() - started });
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': Math.ceil(rl.resetMs / 1000).toString() } }
    );
  }

  // Build bounded candidate pool from Supabase
  try {
    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
    const inferred = inferHeuristicsFromText(lastUserMsg);
    const candidates = await getCandidates(completed_ids, preferences, 20, lastUserMsg, inferred);

    // Build prompts and call OpenAI (return raw JSON text for now)
    const systemMsgs = buildSystemPrompt(locale);
    const userMsg = buildUserPrompt(messages, candidates, locale, completed_ids.length, inferred.season, inferred.difficultyStars, inferred.regions);
    let model_raw: string | null = null;
    try {
      model_raw = await callOpenAIJSON([...systemMsgs, ...userMsg], apiKey);
    } catch (err) {
      // Surface a controlled error but do not fail the entire endpoint if model call fails
      logEvent({ status: 'error:model_call', ip, locale, completed_ids_length: completed_ids.length, candidates_count: candidates.length, duration_ms: Date.now() - started, error: err instanceof Error ? err.message : 'unknown' });
      return NextResponse.json({
        success: false,
        error: 'Model call failed',
        details: err instanceof Error ? err.message : 'unknown',
      }, { status: 502 });
    }

    // Parse and validate model output
    const parsed = model_raw ? safeParseModel(model_raw) : null;
    if (!parsed) {
      logEvent({ status: 'error:invalid_model_output', ip, locale, completed_ids_length: completed_ids.length, candidates_count: candidates.length, duration_ms: Date.now() - started });
      return NextResponse.json({
        success: false,
        error: 'Invalid model output',
        model_raw,
      }, { status: 502 });
    }

    // Validate suggestions: map unknown IDs by matching names across locales, then filter to candidate set
    const candidateIds = new Set(candidates.map(c => c.id));
    const nameToId = new Map<string, string>();
    for (const c of candidates) {
      if (c.name_en) nameToId.set(c.name_en.toLowerCase(), c.id);
      if (c.name_ja) nameToId.set(c.name_ja.toLowerCase(), c.id);
      if (c.name_zh) nameToId.set(c.name_zh.toLowerCase(), c.id);
    }
    const remapped = (parsed.suggestions ?? []).map((s) => {
      if (!s.mountain_id || candidateIds.has(s.mountain_id)) return s;
      const nid = nameToId.get(String(s.mountain_id).toLowerCase());
      return nid ? { ...s, mountain_id: nid } : s;
    });
    const validSuggestions = remapped.filter(s => candidateIds.has(s.mountain_id));

    logEvent({ status: 'ok', ip, locale, completed_ids_length: completed_ids.length, candidates_count: candidates.length, suggestions_count: validSuggestions.length, duration_ms: Date.now() - started });
    return NextResponse.json({
      success: true,
      status: 'ok',
      request: { locale, completed_ids_length: completed_ids.length, preferences, messagesCount: messages.length },
      suggestions: validSuggestions,
      followups: parsed.followups,
      disclaimer: parsed.disclaimer,
      meta: {
        candidates_count: candidates.length,
        dropped_suggestions: (parsed.suggestions?.length || 0) - validSuggestions.length,
      }
    });
  } catch (e) {
    logEvent({ status: 'error:candidates', ip: getClientIp(request), duration_ms: Date.now() - started, error: e instanceof Error ? e.message : 'unknown' });
    return NextResponse.json(
      { success: false, error: 'Failed to load candidates' },
      { status: 500 }
    );
  }
}
