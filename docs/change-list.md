# Change List & New Features
---

# Change List & New Features — Hyakumeizan Tracker Redesign (October 2025)

## Overview
This document enumerates all changes required to achieve the new UX, grouped by page/feature. Each item includes rationale, affected files/dirs, and risk level.

---

## 1. Landing Page (`/`)
### Changes
- Add hero section with value props and CTA (Sign Up / Log In)
- Add explainer of tracking flow (map + list + dashboards + shareable profile)
- Optionally add social proof/screenshots

**Why:** Improves onboarding, clarifies value, increases conversion.
**Files/Dirs:**
- `src/app/[locale]/page.tsx`
- `src/lib/i18n/messages/*`
- Asset folder for images/screenshots
**Risk:** Low (UI only)

---

## 2. Tracking Page (`/tracker`)
### Changes
- Sidebar: searchable, filterable list of 100 mountains (EN/JA/ZH, region, prefecture)
- Sidebar: toggle to float climbed items to top
- Main: SVG cartoonized region map, region completion counts, interactive filtering
- Dashboards: difficulty breakdown, altitude buckets, total climbed
- All aggregates derived from single source of truth (DB)

**Why:** Centralizes progress tracking, improves UX, prevents desync.
**Files/Dirs:**
- `src/app/[locale]/tracker-v2/page.tsx`
- `src/components/tracker/*`
- `src/components/dashboard/*`
- `src/lib/constants/mountains.ts`
- `src/lib/data/mountains.json`
- SVG asset folder
**Risk:** Medium (SVG integration, state sync)

---

## 3. Personal Profile Page (`/u/[slug]`)
### Changes
- Public, shareable slug (not tied to email/UID)
- Name-card visual: display name, avatar, total climbed, per-region matrix, badges
- Copy-to-clipboard share link
- Privacy: expose only whitelisted public fields, respect RLS

**Why:** Enables sharing, social proof, privacy compliance.
**Files/Dirs:**
- `src/app/u/[slug]/page.tsx`
- `src/components/sharing/*`
- DB schema/migrations (profiles, RLS)
**Risk:** Medium (privacy, slug collision)

---

## 4. Shared State & Data Layer
### Changes
- Consolidate reads/writes to single DB source
- Debounced optimistic updates for completions
- Error handling for network failures
- All dashboard widgets read from same queried dataset

**Why:** Prevents desync, improves reliability, easier debugging.
**Files/Dirs:**
- `src/hooks/useMountainCompletions.ts`
- `src/lib/supabase/api.ts`
- `src/types/dashboard.ts`, `src/types/mountain.ts`
- DB views/RPCs
**Risk:** High (data integrity, debugging)

---

## 5. Database Schema & Migrations
### Changes
- Confirm canonical mountains dataset (deduped, all fields present)
- Ensure region, difficulty, elevation consistency
- Add/extend views for region, difficulty, altitude buckets
- Migration strategy: additive, non-breaking

**Why:** Ensures data quality, supports new dashboards, prevents breaking changes.
**Files/Dirs:**
- `db/schema.sql`, `db/seed_mountains.sql`, `db/views_and_rpcs.sql`
- `supabase/migrations/*`
**Risk:** Medium (migration safety)

---

## 6. i18n & Localization
### Changes
- Localize all new UI and copy (EN/JA/ZH)
- Ensure region names, difficulty, and dashboard labels are translated

**Why:** Supports multi-lingual users, improves accessibility.
**Files/Dirs:**
- `src/lib/i18n/messages/*`
- UI components
**Risk:** Low

---

## 7. Analytics & Telemetry (Optional MVP)
### Changes
- Track key events: mark climbed/unclimbed, share profile, region filter
- Add sanity checks for aggregate mismatches

**Why:** Enables usage insights, debugging, and data validation.
**Files/Dirs:**
- Shared lib for analytics hooks
- UI event handlers
**Risk:** Low

---

## 8. Visual & Asset Updates
### Changes
- Finalize SVG map asset (regions, IDs)
- Add visual style references for cartoon map and badges
- Update dashboard card visuals

**Why:** Ensures cohesive, appealing UI.
**Files/Dirs:**
- Asset folder for SVGs/images
- `src/components/dashboard/*`, `src/components/tracker/*`
**Risk:** Medium (designer dependency)

---

## 9. Miscellaneous
### Changes
- Update onboarding copy, CTA, and help text
- Add loading skeletons and error states to all async components

**Why:** Improves UX, reduces confusion, increases polish.
**Files/Dirs:**
- `src/app/[locale]/page.tsx`, `src/components/*`
- i18n messages
**Risk:** Low

---

## Summary Table
| Feature/Page         | Change Summary                                 | Files/Dirs                        | Risk Level |
|---------------------|------------------------------------------------|------------------------------------|------------|
| Landing Page        | Hero, CTA, explainer, social proof             | page.tsx, i18n, assets             | Low        |
| Tracking Page       | Sidebar, SVG map, dashboards, state sync       | tracker-v2, components, SVG, data  | Medium     |
| Profile Page        | Slug, name-card, badges, privacy               | u/[slug], sharing, DB, RLS         | Medium     |
| State/Data Layer    | Single source, debounced updates, error handle | hooks, API, types, DB views        | High       |
| DB Schema           | Canonical data, views, migrations               | schema, seed, views, migrations    | Medium     |
| i18n                | Localize all new UI/copy                        | i18n, UI components                | Low        |
| Analytics           | Track events, sanity checks                     | analytics lib, UI handlers         | Low        |
| Visual/Assets       | SVG map, style refs, dashboard visuals          | assets, dashboard/tracker comps    | Medium     |
| Miscellaneous       | Copy, loading skeletons, error states           | page.tsx, components, i18n         | Low        |

---

See `tasks-mvp-tracker.md` for the step-by-step implementation plan.
  - Why: Meet shareable design requirements.
  - Files: rewrite `src/app/u/[slug]/page.tsx`, add `src/components/profile/ProfileCard.tsx`, CSS in `styles/globals.css` or new module.
  - Risk: Medium (design implementation + responsiveness).
- **Share link & metadata polishing**
  - Why: Provide copy-to-clipboard, refined OG meta, optional QR.
  - Files: update `ProfileCard` buttons, `src/app/api/og/route.tsx`, ensure clipboard interactions accessible.
  - Risk: Low (existing components can be reused).
- **Optional badge showcase + recent activity with names**
  - Why: Enrich profile insight; align with tracker badges.
  - Files: `BadgeDisplay` reuse/adaptation, new query joining `mountains` for names, update `user_mountains` view.
  - Risk: Medium (DB join + localization).

## Shared Data & Infrastructure
- **Consolidated data access layer**
  - Why: Stop duplicating Supabase queries across components; centralize snapshot + mountain metadata fetches.
  - Files: new `src/lib/data-access/tracker.ts`, refactor `useMountainCompletions`, `MountainGuideChat`, profile loader.
  - Risk: High (touches multiple feature areas; regression surface wide).
- **Supabase schema alignment (difficulty, altitude, regions)**
  - Why: Ensure `mountains` table matches expectations (difficulty stars, elevation, region IDs) and seed data up to date.
  - Files: new migration altering `mountains`, backfill script, update `db/schema.sql`, `db/seed_mountains.sql`.
  - Risk: Medium (DB migrations affecting production data).
- **Shared mountain constants module**
  - Why: Provide single source for altitude buckets and difficulty stars used across tracker and dashboards.
  - Files: `src/lib/constants/mountains.ts`.
  - Risk: Low (pure constants; consumers must adopt helper types).
- **Altitude aggregates view & snapshot payload**
  - Why: Serve consistent altitude bucket totals/complete counts to tracker dashboards without recalculating client-side.
  - Files: `supabase/migrations/*_add_altitude_buckets_view.sql`, `db/views_and_rpcs.sql`, `src/types/dashboard.ts`.
  - Risk: Low (additive JSON payload field; ensure clients handle new `by_altitude` array).
- **Aggregations for altitude buckets & derived views**
  - Why: Power dashboard cards with consistent data; prefer server views.
  - Files: new SQL view (`v_altitude_buckets`), adjust `dashboard_snapshot` (add altitude/region counts), update `src/types/dashboard.ts`.
  - Risk: Medium (backward compatibility; ensure existing RPC consumers unaffected).
- **Optimistic updates with rollback on RPC failure**
  - Why: Guarantee single source of truth and consistent UX on errors.
  - Files: `useMountainCompletions.ts`, `src/lib/supabase/api.ts` (wrap `toggle_completion`), error handling in tracker UI.
  - Risk: Medium (state management intricacies).
- **Map assets pipeline**
  - Why: Need cartoonized SVG with stable region IDs and responsive rendering.
  - Files: asset storage (`public/maps`), documentation under `docs/`, possible tooling to convert design asset.
  - Risk: Low (external dependency on design team).
- **Internationalization audit**
  - Why: New copy requires translations; ensure resources exist for en/ja/zh.
  - Files: extend `src/lib/i18n/messages/*`, add keys for landing, tracker UI, profile, map labels.
  - Risk: Low (content changes; QA for missing keys).
- **Telemetry & sanity checks**
  - Why: Detect desync between client aggregates and server snapshot during development.
  - Files: dev-only check in tracker loader, logging utilities.
  - Risk: Low (behind dev flag).

## Backend & Auth
- **Profile slug uniqueness + collision handling**
  - Why: Current signup generates slug without checking existing DB entries; may collide.
  - Files: server-side slug service (Supabase RPC or API route), update signup flow.
  - Risk: Medium (requires transactional logic).
- **Public profile permissions**
  - Why: Need RLS policy or security definer function to expose public fields safely.
  - Files: new policy/migration, potential `public_profile` RPC returning sanitized data.
  - Risk: High (security-sensitive change).
- **Audit auth flows for logout & redirects**
  - Why: Dashboard uses `window.location.href` for sign-out; should call Supabase signOut and redirect cleanly.
  - Files: `useAuth.ts`, tracker header, global navigation component.
  - Risk: Low (straightforward refactor).

## Design System & Styling
- **Shared layout primitives (two-column tracker shell, cards)**
  - Why: Reduce duplication across new tracker/profile components.
  - Files: new `src/components/ui/Card.tsx`, `src/components/layout/PageShell.tsx`, Tailwind theme extension.
  - Risk: Medium (affects multiple pages’ styling).
- **Responsive typography and spacing tokens**
  - Why: Align landing, tracker, profile for consistent look/feel.
  - Files: `styles/globals.css`, Tailwind config, documentation in `docs/style-guide.md` (optional).
  - Risk: Low (mostly CSS adjustments).

## Tooling & Monitoring
- **Docs for data contracts and component API**
  - Why: Keep future contributors aligned; required for incremental build-out.
  - Files: `docs/` updates (spec for map, sidebar, dashboard aggregates).
  - Risk: Low.
- **Storybook or visual test harness (optional)**
  - Why: Preview landing/tracker/profile components in isolation.
  - Files: new dev dependency, `.storybook` setup, component stories.
  - Risk: Medium (tooling overhead, but optional for MVP).
