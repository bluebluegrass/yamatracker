# AI Chatbot Tasks — “Mountain Guide”

Purpose: Add a server-backed chatbot that recommends the next mountain(s) to climb based on a user’s completed history and optional preferences, integrated into the existing Next.js + Supabase app.

---

## High-Level Goals
- Enable authenticated users to chat with a “Mountain Guide.”
- Recommend 1–3 next mountains with clear reasons, only from the canonical `mountains` table and excluding completed ones.
- Respect locale (en/ja/zh) in responses and display names.
- Keep costs predictable with rate limits, bounded prompts, and caching.

## Assumptions
- Existing stack: Next.js (App Router), Supabase, next-intl, Tailwind.
- `useMountainCompletions` provides `completedIds` on the client.
- `mountains` table is authoritative source with fields used in UI (id, names, region, difficulty, elevation_m, etc.).
- OpenAI API key provided via server-only env var.

---

## Architecture Overview
- Client UI: `MountainGuideChat` component renders a small chat panel on the dashboard.
- API Route: `POST /api/chat` runs server-side; calls OpenAI with a structured prompt and returns validated suggestions.
- Data Inputs: minimal user context (completed IDs, locale, optional prefs) and a bounded candidate list from `mountains`.
- Validation: server ensures suggested IDs exist and are not completed; drops invalid items.
- i18n: Responses in the UI language. Names are rendered using the correct locale name fields when displayed.

---

## Phase 0 — Decisions (Before Coding)
- Scope: MVP returns top 3 suggestions with reasons; allows simple follow-ups (region/difficulty).
- Auth: Require sign-in for chat, or allow anonymous with no history? (Recommend: require sign-in.)
- Model: Start with a cost-effective, reasonably capable model; enforce JSON output.
- Rate Limit: Per user/IP burst + daily cap to control cost.

Deliverable: Short note in `DEPLOYMENT.md` documenting the final choices.

---

## Phase 1 — Server API Endpoint

1) Env Vars (server-only)
- Add to `.env.local` (do not commit):
  - `OPENAI_API_KEY="..."`

2) Route: `src/app/api/chat/route.ts`
- Accept `POST` with JSON body:
  ```json
  {
    "locale": "en|ja|zh",
    "completed_ids": ["0001", "0002"],
    "preferences": {
      "regions": ["関東"],
      "difficulty": ["★", "★★"],
      "season": "spring|summer|autumn|winter|null"
    },
    "messages": [
      {"role": "user", "content": "I want something near Tokyo and not too hard."}
    ]
  }
  ```

- Response JSON contract:
  ```json
  {
    "suggestions": [
      {"mountain_id": "0123", "title": "...", "reason": "..."},
      {"mountain_id": "0456", "title": "...", "reason": "..."}
    ],
    "followups": ["..."],
    "disclaimer": "..."
  }
  ```

3) Rate Limiting
- Add basic rate limiting (per IP and per user_id if authenticated). Options:
  - In-memory token bucket (OK for MVP).
  - Pluggable store (e.g., Upstash) later.
- Return `429` with retry hints when exceeded.

4) Input Validation
- Clamp message length (e.g., 1,000 chars) and array sizes.
- Validate `locale ∈ {en, ja, zh}`.
- Validate enums (difficulty stars, season). Drop invalid values.

5) Candidate Pool (bounded)
- Fetch `mountains` from Supabase (server-side) or accept a minimal client-provided candidate list in MVP.
- Build candidates by removing `completed_ids` and applying soft filters (regions/difficulty).
- Truncate to at most N=20 candidates to control prompt size.

6) Prompting Strategy
- System: “You are Japan Mountain Guide. Recommend next climbs only from candidates. Return strict JSON. Use language = <locale>.”
- Tools: Provide candidate list with `id`, `name_en`, `region`, `difficulty`, `elevation_m`.
- Instruction: “Pick up to 3 distinct IDs; explain why each fits the user’s history and stated preferences; avoid already completed; prefer variety across region/difficulty if possible; be concise.”
- Enforce JSON output with a minimal schema; reject or repair non-JSON.

7) Model Call
- Configure temperature ~0.4–0.7 and max tokens ~400.
- Use JSON or tool/function calling to guarantee structure.
- Timeouts and retries (exponential backoff, max 2 retries).

8) Post-Processing & Validation
- Parse JSON safely; on parse failure, return a friendly fallback.
- Ensure `mountain_id` ∈ candidates and not in `completed_ids`; otherwise drop.
- If 0 valid results, return empty `suggestions` with follow-up guidance.

9) Logging (no PII)
- Log metadata: user_id, locale, candidate_count, suggestion_count, tokens, latency, error type.
- Do not log full user text by default.

---

## Phase 2 — Recommendation Logic Refinements
- Heuristics for variety: avoid repeatedly recommending same region/difficulty if user is heavily skewed.
- Tie-breakers: prefer medium elevation if the user asked for easier; balance by remaining counts per region.
- Seasonal hints: if season provided, lightly prioritize mountains typically favorable that season (can be prompt-only initially).
- Future: maintain a small preference profile per user (e.g., last chosen difficulty/region).

---

## Phase 3 — Frontend UI

1) Component: `src/components/chat/MountainGuideChat.tsx`
- Features:
  - Message list (user/assistant), input box, send button, loading spinner.
  - Optional quick-filter chips (regions, difficulty stars).
  - Displays suggestions as clickable cards that open the existing mountain card or scroll into view.
  - Error and empty states with retry.
  - Keyboard and screen reader accessible.

2) Integration
- Add a floating button on `src/app/[locale]/dashboard/page.tsx` to toggle the chat panel.
- Pass `completedIds` from `useMountainCompletions` and current `locale`.
- On response, map `mountain_id` to localized mountain name for display.

3) i18n
- Add strings to: `src/lib/i18n/messages/en.json`, `ja.json`, `zh.json`:
  - “Ask the Mountain Guide”, “Type your question…”, “Send”, errors, placeholders, and short help text.

---

## Phase 4 — Auth, Security, Privacy
- Require sign-in to access `/api/chat` (recommended). For anonymous, skip history and limit rate more strictly.
- Sanitize/trim user input; reject binary/HTML.
- Return generic errors to client; keep details server-side.
- Do not expose API keys to the client.

---

## Phase 5 — Observability & Analytics (Optional in MVP)
- Add a lightweight `chat_events` table (timestamp, user_id, tokens_in/out, suggestions_count, status).
- Create an admin-only debug page or log viewer.

---

## Phase 6 — QA Plan
- Cases:
  - New user (no completions).
  - User concentrated in one region; ask for variety.
  - User requests easy routes but has mostly hard left.
  - Locale: verify reply language and localized names.
  - Invalid output from model: fallback path and messaging.
  - Rate limiting: ensure correct 429 behavior.

---

## Phase 7 — Performance & Cost Controls
- Limit candidate list and tokens; prefer compact fields.
- Caching: memoize recommendations per (user_id + preferences) for short TTL to reduce duplicate calls.
- Backoff and circuit-breaker on repeated failures.

---

## Phase 8 — Rollout & Documentation
- Feature flag the chat button for a subset of users.
- Update `DEPLOYMENT.md` with env vars, rate limits, and monitoring.
- Brief user-facing help in README or a tooltip in the UI.

---

## Concrete TODO Checklist

Backend
- [ ] Add `OPENAI_API_KEY` to `.env.local` (server-only)
- [ ] Implement `src/app/api/chat/route.ts` (POST)
- [ ] Add input validation and enums for locale/difficulty/season
- [ ] Build candidate list from `mountains` − `completed_ids` (cap at 20)
- [ ] Implement prompt with strict JSON schema
- [ ] Call model with timeout/retries; parse response safely
- [ ] Validate suggestion IDs; drop invalids; return normalized JSON
- [ ] Add rate limiting (per user/IP) and return 429 when exceeded
- [ ] Add minimal logging (no PII)

Frontend
- [ ] Create `src/components/chat/MountainGuideChat.tsx`
- [ ] Integrate floating launcher on `src/app/[locale]/dashboard/page.tsx`
- [ ] Wire `completedIds` and locale; post to `/api/chat`
- [ ] Render suggestions with localized names and reasons
- [ ] Handle loading, error, empty states; ensure a11y

i18n & Docs
- [ ] Add chat UI strings to `en.json`, `ja.json`, `zh.json`
- [ ] Document feature and env setup in `DEPLOYMENT.md`
- [ ] Add a simple feature flag toggle (env or config)

QA
- [ ] Manual test for key scenarios (see Phase 6)
- [ ] Verify rate limiting and failure handling
- [ ] Validate output mapping to real `mountains` entries

---

## Example Payloads

Request (POST `/api/chat`):
```json
{
  "locale": "en",
  "completed_ids": ["0010", "0023", "0056"],
  "preferences": {"regions": ["関東"], "difficulty": ["★", "★★"], "season": "autumn"},
  "messages": [{"role": "user", "content": "Near Tokyo, not too hard, good for autumn."}]
}
```

Response:
```json
{
  "suggestions": [
    {"mountain_id": "0137", "title": "Scenic Kanto Ridge", "reason": "Close to Kanto, easier grade (★–★★), nice autumn foliage."},
    {"mountain_id": "0172", "title": "Beginner-Friendly Summit", "reason": "Low elevation and moderate trails align with your history."}
  ],
  "followups": ["Prefer a specific prefecture?", "Looking for public transport access?"],
  "disclaimer": "Verify local conditions and access before hiking."
}
```

---

## Files to Create/Modify
- `src/app/api/chat/route.ts` — server route calling OpenAI and returning recommendations
- `src/components/chat/MountainGuideChat.tsx` — chat UI panel
- `src/app/[locale]/dashboard/page.tsx` — add floating launcher, mount chat component
- `src/lib/i18n/messages/*.json` — add chatbot UI strings
- `DEPLOYMENT.md` — env vars and feature flag notes

