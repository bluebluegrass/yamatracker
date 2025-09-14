# Changelog

## [Unreleased] – Chatbot integration and UX improvements

- Planning: Added `AI_chatbot_tasks.md` outlining phases, API contract, and QA.
- API: New `POST /api/chat` at `src/app/api/chat/route.ts`
  - Server-only env guard for `OPENAI_API_KEY` and optional `OPENAI_MODEL`.
  - Minimal, dependency-free input validation and clamping.
  - Candidate pool from Supabase `mountains` with filters: exclude completed, region, difficulty; bounded size.
  - Heuristics: infer season and region from free text; proximity for Shinjuku (3h car) and Osaka (≤2h Shinkansen); prefecture normalization.
  - Deterministic variation by rotating candidates using last prompt text.
  - OpenAI call with JSON response format; parsing and strict validation against candidates; name→ID remapping.
  - No synthetic suggestions if none valid; returns empty list instead.
  - Tightened prompt to avoid unsupported claims (e.g., camping/facilities) when data isn’t provided.
  - Basic per‑IP rate limiting (10/min) and minimal structured logging (no PII).
- UI: New chat panel `src/components/chat/MountainGuideChat.tsx`
  - Message list, typing indicator, loading/error handling, history preserved when toggling.
  - Quick filters (Region, Difficulty ★..★★★★★, Season) sent as structured preferences.
  - Suggestions rendered with localized names; friendly “no results” assistant message.
  - Darker input text/placeholder for readability; cleared old suggestions on new turn.
- Dashboard integration: Floating launcher to open/close the guide in `src/app/[locale]/dashboard/page.tsx`, now localized.
- i18n: Added chat strings to `en/ja/zh` (`chat.title`, `chat.region`, `chat.difficulty`, `chat.season`, `chat.clear`, `chat.send`, `chat.askPlaceholder`, `chat.open`, `chat.close`, `chat.typing`, `chat.noResults`).

Notes:
- To improve accuracy for niche queries (e.g., winter camping), consider enriching `mountains` with explicit fields (camping_allowed, winter_suitable, etc.) and enforcing server filters before prompting.
- You can switch models via `.env.local`: `OPENAI_MODEL=gpt-4o` (or `gpt-4.1`) and restart the dev server.
