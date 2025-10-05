# Change List & New Features

## Landing Page (`/`)
- **Hero layout with localized value prop & CTA**
  - Why: Current page auto-redirects; needs persuasive messaging to drive sign-up/log-in.
  - Files: `src/app/[locale]/page.tsx`, `src/lib/i18n/messages/*`, potential new `src/components/landing/Hero.tsx`.
  - Risk: Medium (client component rewrite + localization coverage).
- **Feature explainer section (map + list + dashboards + shareable profile)**
  - Why: Communicate tracking workflow and future-state UI to new visitors.
  - Files: `src/app/[locale]/page.tsx`, potential `src/components/landing/FeatureGrid.tsx`, asset references in `public/`.
  - Risk: Low (static content, responsive layout work).
- **Auth entry points (inline forms or modals)**
  - Why: Reduce friction by surfacing sign-up/log-in directly on landing.
  - Files: `src/components/auth/*` (new), `src/app/[locale]/page.tsx`, `src/lib/i18n/messages/*`.
  - Risk: Medium (validation + shared usage between landing and dedicated pages).
- **Optional social proof / screenshot carousel**
  - Why: Increase credibility; highlight new tracker/profile visuals.
  - Files: `public/images/landing/*`, new carousel component under `src/components/landing/`.
  - Risk: Low (content dependency; ensure responsive behavior).

## Tracking Page (`/tracker` replacing `/dashboard`)
- **Route realignment (`/tracker`) with locale support**
  - Why: Naming clarity; align with product vocabulary.
  - Files: rename `src/app/[locale]/dashboard/page.tsx` → `tracker/page.tsx`, update links (`LanguageSwitcher`, auth buttons, redirects).
  - Risk: Medium (ensure middleware + links handle new path).
- **Sidebar mountain list with search, filters, and sort toggles**
  - Why: Current grid is hard to scan; new UX mandates searchable list with region/prefecture filters and “completed first” option.
  - Files: new `src/components/tracker/MountainList.tsx`, `src/hooks/useMountainDirectory.ts` (new), updates to `useMountainCompletions` for derived selectors.
  - Risk: High (significant interaction logic + performance considerations for 100-row list).
- **Interactive Japan region map (cartoonized SVG)**
  - Why: Visual completion feedback, region filtering entry point.
  - Files: new `public/maps/japan-regions.svg`, `src/components/tracker/RegionMap.tsx`, shared styling in `styles/globals.css` or module CSS.
  - Risk: High (asset prep, accessibility, sync between SVG IDs and DB region keys).
- **Dashboard cards (difficulty, altitude buckets, total progress)**
  - Why: Provide aggregate insights below the map per requirements.
  - Files: extend/replace `src/components/dashboard/DifficultyBreakdown.tsx`, add `AltitudeBreakdown`, `TotalsCard`, update `src/types/dashboard.ts`.
  - Risk: Medium (aggregation logic + layout responsiveness).
- **Single data loader for tracker (server-driven or RPC-backed)**
  - Why: Avoid client/data drift; ensure list, map, and dashboards read from the same dataset.
  - Files: new `src/app/[locale]/tracker/loaders.ts` (server actions) or data hook refactor, reuse `dashboard_snapshot`, adjust `useMountainCompletions` to consume snapshot + handle optimistic updates.
  - Risk: High (state management refactor; must preserve existing UX while adopting authoritative snapshot).
- **Region filter interop between map and sidebar**
  - Why: Clicking a region should filter the sidebar, and search should highlight counts on the map.
  - Files: tracker page state container (e.g., `TrackerView.tsx`), shared context/store, `RegionMap.tsx`, `MountainList.tsx`.
  - Risk: Medium (cross-component state coordination).
- **Loading, error, and empty states revamp**
  - Why: Current UI shows generic “Loading…”; need skeletons and actionable errors.
  - Files: `src/components/tracker/LoadingState.tsx`, `useMountainCompletions.ts`, `RegionMap.tsx`.
  - Risk: Low (mostly UI scaffolding, but verify hooks provide status flags).
- **Analytics hooks (optional, MVP)**
  - Why: Track completion toggles, filter usage, sharing events for future insights.
  - Files: new lightweight analytics helper (`src/lib/analytics.ts`), instrumentation in tracker components.
  - Risk: Low (non-blocking; degrade gracefully if analytics disabled).

## Personal Profile (`/u/[slug]`)
- **Server-side data fetch with RLS-safe view**
  - Why: Current client fetch is blocked by RLS; must expose only public fields.
  - Files: new Supabase view (e.g., `public_profile_view`), API route or server component loader, update `src/app/u/[slug]/page.tsx` to be server-rendered.
  - Risk: High (requires DB migration + RLS adjustments; must avoid leaking private data).
- **Name-card layout with avatar, per-region matrix, badges**
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
