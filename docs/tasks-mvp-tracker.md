# MVP Tracker Task Plan

Tasks are strictly ordered; complete one before starting the next. Each task is scoped to ~10 minutes of work.

## T1. Align `mountains` schema with current feature needs
- **Goal:** Ensure the Supabase `mountains` table exposes `difficulty`, `prefecture`, and elevation data expected by the app.
- **Inputs/Decisions:** Final column list (difficulty stars, physicality, optional metadata); confirm production DB shape.
- **Proposed file edits:** `supabase/migrations/<new>_alter_mountains.sql`, `db/schema.sql`, `src/types/mountain.ts` (if fields change).
- **Acceptance criteria:** Migration runs locally without errors; TypeScript types compile; `npm run lint` passes.
- **Rollback:** Revert the migration and schema/type changes; rerun previous migration snapshot.

## T2. Refresh canonical mountain seed data
- **Goal:** Synchronize seed dataset with canonical 100-mountain list, including difficulty and altitude info.
- **Inputs/Decisions:** Authoritative spreadsheet/source; how to handle missing translations.
- **Proposed file edits:** `db/seed_mountains.sql`, optional CSV/JSON under `src/lib/data/` for reference.
- **Acceptance criteria:** Seed script loads in Supabase sandbox without constraint violations; sample query returns expected fields.
- **Rollback:** Restore prior seed file; re-seed database from backup.

## T3. Define altitude buckets and difficulty constants
- **Goal:** Centralize altitude bucket thresholds and difficulty labels for reuse across UI and DB views.
- **Inputs/Decisions:** Thresholds (<1000, 1000–1999, 2000–2999, ≥3000) and star scale (★–★★★★).
- **Proposed file edits:** New constants module (`src/lib/constants/mountains.ts`), update `docs/change-list.md` if thresholds change.
- **Acceptance criteria:** Constants exported with tests (or unit assertions) covering buckets; `npm run lint`.
- **Rollback:** Remove new constants module; revert docs.

## T4. Extend Supabase views with altitude aggregates
- **Goal:** Provide `v_altitude_buckets` or extend `dashboard_snapshot` with bucket counts for consistent server-side data.
- **Inputs/Decisions:** Whether to create a new view vs. mutate `dashboard_snapshot`; confirm backward compatibility.
- **Proposed file edits:** `db/views_and_rpcs.sql`, new `supabase/migrations/<new>_altitude_view.sql`.
- **Acceptance criteria:** Running migration exposes new view; calling `dashboard_snapshot` via Supabase SQL returns altitude data without breaking existing fields.
- **Rollback:** Drop new view/function version and revert migration.

## T5. Add public profile view with RLS-safe fields
- **Goal:** Create a Supabase view or RPC that exposes `{ slug, display_name, avatar_url, completion_counts }` while respecting privacy.
- **Inputs/Decisions:** Final list of public columns; whether badges are included.
- **Proposed file edits:** `supabase/migrations/<new>_public_profile_view.sql`, `db/views_and_rpcs.sql` docs.
- **Acceptance criteria:** Authenticated anon key can `select` from the new view by slug; no private columns exposed; RLS tests pass.
- **Rollback:** Drop the view and revert migration.

## T6. Update Supabase client helpers
- **Goal:** Wrap RPC/view calls in a typed data access layer.
- **Inputs/Decisions:** Decide between server actions vs. route handlers; data shapes to expose.
- **Proposed file edits:** New module `src/lib/data-access/supabase.ts`, update `src/lib/supabase/api.ts` to export new helpers.
- **Acceptance criteria:** TypeScript compile; `npm run lint`; unit tests (if added) cover at least snapshot fetch.
- **Rollback:** Remove new module; revert API helper edits.

## T7. Refactor `useMountainCompletions` to consume snapshot API
- **Goal:** Use the new data layer for reads/writes, ensuring the hook stays in sync with server aggregates.
- **Inputs/Decisions:** How to merge snapshot data with optimistic updates; error handling strategy.
- **Proposed file edits:** `src/hooks/useMountainCompletions.ts`, possibly new tests/hooks docs.
- **Acceptance criteria:** Toggling a mountain fetches updated snapshot; local state mirrors server data; lint passes.
- **Rollback:** Revert hook changes to prior implementation.

## T8. Create tracker page loader (server component or route)
- **Goal:** Fetch snapshot + mountain metadata server-side and stream to the tracker page.
- **Inputs/Decisions:** Choose between server component loader vs. `/api/tracker` JSON endpoint.
- **Proposed file edits:** `src/app/[locale]/tracker/page.tsx` (convert to server/Client boundary), new loader file (`src/app/[locale]/tracker/loader.ts`).
- **Acceptance criteria:** Tracker renders with server-fetched data in dev; hydration succeeds; lint passes.
- **Rollback:** Restore previous client-only page.

## T9. Implement tracker layout shell (two-column responsive)
- **Goal:** Establish sidebar/main layout with placeholders for list, map, dashboards.
- **Inputs/Decisions:** Breakpoints, container widths, scroll behavior.
- **Proposed file edits:** `src/app/[locale]/tracker/page.tsx`, new layout styles in `styles/globals.css` or scoped CSS.
- **Acceptance criteria:** Layout renders placeholders, maintains accessibility (landmarks, headings); passes lint.
- **Rollback:** Revert layout changes.

## T10. Build `MountainList` component with search input
- **Goal:** Render searchable list of mountains with completion toggles using existing state.
- **Inputs/Decisions:** Debounce interval, display fields, localization for search placeholder.
- **Proposed file edits:** `src/components/tracker/MountainList.tsx`, `src/lib/i18n/messages/*`, tests if added.
- **Acceptance criteria:** Typing filters list client-side; toggling item still works; lint/tests pass.
- **Rollback:** Remove new component file; restore tracker page import.

## T11. Add filters (region/prefecture, show completed first)
- **Goal:** Layer filter controls onto `MountainList` and wire to tracker state.
- **Inputs/Decisions:** Multi-select vs. single select, persistence across sessions.
- **Proposed file edits:** `src/components/tracker/MountainList.tsx`, tracker state container.
- **Acceptance criteria:** Filters adjust list results; toggles update counts; existing tests updated.
- **Rollback:** Revert component and state changes.

## T12. Integrate optimistic completion toggle with rollback
- **Goal:** Ensure list + map react instantly while retrying on failure.
- **Inputs/Decisions:** Error toast copy, retry count.
- **Proposed file edits:** `useMountainCompletions.ts`, tracker state/context.
- **Acceptance criteria:** Simulated failure (mock throwing) rolls back UI; success updates snapshot.
- **Rollback:** Restore previous toggle logic.

## T13. Introduce `RegionMap` component (static SVG render)
- **Goal:** Render cartoonized map with region labels using provided SVG.
- **Inputs/Decisions:** Asset slicing, viewBox sizing, accessible labels.
- **Proposed file edits:** `public/maps/japan-regions.svg`, `src/components/tracker/RegionMap.tsx`.
- **Acceptance criteria:** Map displays in tracker main column with region hover states; lint passes.
- **Rollback:** Remove component and asset; revert imports.

## T14. Bind map shading to completion data
- **Goal:** Color regions based on `completed/total` ratio and display counts.
- **Inputs/Decisions:** Color scale, thresholds, text positioning.
- **Proposed file edits:** `RegionMap.tsx`, shared styles/constants.
- **Acceptance criteria:** Region counts match server snapshot; accessible descriptions announce status; lint/tests pass.
- **Rollback:** Revert shading logic to static render.

## T15. Wire map-to-sidebar filter interactions
- **Goal:** Clicking a region filters the sidebar list; clear filter resets view.
- **Inputs/Decisions:** Multi-region selection, toggle vs. single select.
- **Proposed file edits:** `RegionMap.tsx`, tracker state container, `MountainList.tsx` props.
- **Acceptance criteria:** Region click updates list and UI chips; keyboard interaction works; tests updated.
- **Rollback:** Remove interaction wiring; revert state changes.

## T16. Implement dashboard cards (totals, difficulty, altitude)
- **Goal:** Render three stats cards under the map using snapshot aggregates.
- **Inputs/Decisions:** Card layout, color palette, localization keys.
- **Proposed file edits:** New components `src/components/tracker/cards/*.tsx`, update `src/types/dashboard.ts`, i18n messages.
- **Acceptance criteria:** Cards display server counts; unit tests or Storybook snapshot optional; lint passes.
- **Rollback:** Remove new components; restore placeholder area.

## T17. Replace client-side difficulty calc with server data
- **Goal:** Update `DifficultyBreakdown` to consume snapshot values instead of re-deriving from raw list.
- **Inputs/Decisions:** Handling missing difficulty levels; fallback UI.
- **Proposed file edits:** `src/components/dashboard/DifficultyBreakdown.tsx`, tracker page wiring, tests.
- **Acceptance criteria:** Component renders using provided props; matches server counts during manual QA.
- **Rollback:** Revert component to previous implementation.

## T18. Add loading, error, and empty states across tracker
- **Goal:** Provide skeletons/spinners while data loads and actionable errors on failure.
- **Inputs/Decisions:** Skeleton design, retry mechanism.
- **Proposed file edits:** `src/components/tracker/TrackerFallbacks.tsx`, tracker page conditional rendering.
- **Acceptance criteria:** Artificial delays show skeleton; failed fetch surfaces retry button; lint passes.
- **Rollback:** Remove fallback components; restore simple loader.

## T19. Redesign landing page hero + feature sections
- **Goal:** Replace redirect screen with fully localized marketing sections.
- **Inputs/Decisions:** Copy in three locales, CTA destinations, background artwork.
- **Proposed file edits:** `src/app/[locale]/page.tsx`, new components under `src/components/landing/`, `src/lib/i18n/messages/*`.
- **Acceptance criteria:** Landing page renders hero, feature grid, CTA buttons; no auto-redirect; screenshots load responsively.
- **Rollback:** Restore original landing page component.

## T20. Centralize auth CTAs & flows
- **Goal:** Share auth forms/buttons between landing and tracker header; improve sign-out.
- **Inputs/Decisions:** Whether to use modals vs. inline forms; final copy.
- **Proposed file edits:** `src/components/auth/*` (new), `useAuth.ts`, tracker header, landing hero.
- **Acceptance criteria:** Sign-in/up flows work from both landing and dedicated pages; sign-out uses Supabase API then redirects; lint passes.
- **Rollback:** Remove shared auth components; restore previous buttons.

## T21. Rebuild public profile page with server data
- **Goal:** Use the new public profile view to render a name-card layout server-side.
- **Inputs/Decisions:** Card sections (avatar, per-region grid, badges), SSR vs. RSC boundaries.
- **Proposed file edits:** `src/app/u/[slug]/page.tsx` (convert to server component), new `src/app/u/[slug]/profile-card.tsx`.
- **Acceptance criteria:** Visiting `/u/<slug>` renders real data for sample user; no console errors; lint passes.
- **Rollback:** Revert page to previous client component.

## T22. Enhance share actions and metadata
- **Goal:** Update share buttons, clipboard copy, OG image route, and QR generation to match new design.
- **Inputs/Decisions:** Button styles, analytics events, OG background asset.
- **Proposed file edits:** `src/components/sharing/ShareImageGenerator.tsx`, `QRCodeDisplay.tsx`, `src/app/api/og/route.tsx`, profile card.
- **Acceptance criteria:** Share button copies slug URL and shows toast; OG endpoint reflects new layout; lint passes.
- **Rollback:** Revert share component and OG route changes.

## T23. Add analytics instrumentation (optional MVP)
- **Goal:** Emit events for completion toggles, region filters, profile shares.
- **Inputs/Decisions:** Analytics provider (Segment, PostHog, etc.), environment gating.
- **Proposed file edits:** `src/lib/analytics.ts` (new), tracker/profile components instrumentation.
- **Acceptance criteria:** Events captured in dev stub or console; feature disabled when env key missing.
- **Rollback:** Remove analytics helper and instrumentation lines.

## T24. Update documentation
- **Goal:** Record new data contracts, component APIs, and deployment steps.
- **Inputs/Decisions:** Which docs to publish (architecture, onboarding, design tokens).
- **Proposed file edits:** `architecture.md`, `docs/` new specs, `README.md` optional section.
- **Acceptance criteria:** Docs reflect final implementation; reviewers sign off; lint not affected.
- **Rollback:** Revert documentation commits.
