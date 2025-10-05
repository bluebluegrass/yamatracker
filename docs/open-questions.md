# Open Questions & Missing Inputs

A bullet list of all data, assets, and decisions still needed to proceed. Specify who/where to get them if known.

---

- **Final SVG map asset of Japan with region paths and stable `id`s mapping to `mountains.region` values**
	- Who: Designer or external asset source
	- Where: Asset folder (public/maps/), spec in change-list.md

- **Canonical list of 100 mountains** (IDs, names in EN/JA/ZH, region, prefecture, elevation, difficulty)
	- Who: Product owner or authoritative spreadsheet/source
	- Where: db/seed_mountains.sql, src/lib/data/mountains.json

- **Difficulty scale**: Confirm official range (★ to ★★★★ or other)
	- Who: Product owner or reference guide
	- Where: src/lib/constants/mountains.ts, docs/change-list.md

- **Altitude buckets**: Confirm thresholds (<1000, 1000–1999, 2000–2999, ≥3000)
	- Who: Product owner or reference guide
	- Where: src/lib/constants/mountains.ts, db/views_and_rpcs.sql

- **Landing page and profile copy** (CTA, hero, help text)
	- Who: Copywriter or product owner
	- Where: src/lib/i18n/messages/*, docs/change-list.md

- **Visual style references for cartoonized map & badges**
	- Who: Designer
	- Where: Asset folder, dashboard/tracker components

- **Public profile fields**: Exact list of what can be exposed (no private data)
	- Who: Product owner, DB designer
	- Where: DB view, src/app/u/[slug]/page.tsx

- **i18n locales in scope for MVP** (EN/JA/ZH, others?)
	- Who: Product owner
	- Where: src/lib/i18n/messages/*

- **Analytics event schema (if needed)**
	- Who: Product owner, dev lead
	- Where: src/lib/analytics.ts, docs/change-list.md

- **Migration strategy for DB views** (additive, non-breaking)
	- Who: DB designer
	- Where: db/views_and_rpcs.sql, supabase/migrations/*

- **QA checklist and bug reporting process**
	- Who: QA lead
	- Where: docs/tasks-mvp-tracker.md

---

Update this list as new questions arise or decisions are made. Reference in each task before implementation.
