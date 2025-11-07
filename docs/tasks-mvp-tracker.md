
# Step-by-Step Task Plan — Hyakumeizan Tracker Redesign (October 2025)

This plan breaks the redesign into very small, testable, reversible tasks. Each task includes: Goal, Inputs/Decisions, Proposed file edits, Acceptance criteria, and Rollback.

---

## T1. Confirm single source of truth for completions
- **Goal:** Identify and document where completion state is persisted and how it flows to UI.
- **Inputs/Decisions:** Does `user_mountains` exist? What fields? Are there conflicting client caches?
- **Proposed file edits:** None (audit only)
- **Acceptance:** Diagram of current data flow added to `docs/audit-2025-10.md`.
- **Rollback:** N/A (read-only)

---

## T2. Define region map asset contract
- **Goal:** Decide on the SVG asset (regions and IDs) and how counts/opacity map to completion.
- **Inputs/Decisions:** SVG file or plan to generate; region identifiers must match `mountains.region` values.
- **Proposed file edits:** None (spec only)
- **Acceptance:** `docs/open-questions.md` updated with asset needs; spec in `docs/change-list.md`.
- **Rollback:** N/A

---

## T3. Sidebar list spec
- **Goal:** Specify the props/state shape for the MountainList component, search behavior, and selection handling.
- **Inputs/Decisions:** Finalized field names, i18n approach, debounce timings.
- **Proposed file edits:** None (API contract only)
- **Acceptance:** API contract written in `docs/change-list.md`.
- **Rollback:** N/A

---

## T4. Dashboard cards spec
- **Goal:** Define the data interfaces and aggregation rules for difficulty/altitude/total.
- **Inputs/Decisions:** Difficulty range (★–★★★★) and altitude bucket thresholds.
- **Proposed file edits:** None (spec only)
- **Acceptance:** Contracts in `docs/change-list.md`.
- **Rollback:** N/A

---

## T5. Profile slug & privacy rules
- **Goal:** Define slug generation, privacy fields, and RLS implications.
- **Inputs/Decisions:** Whether slugs already exist in `profiles`; collision strategy.
- **Proposed file edits:** None (spec only)
- **Acceptance:** Documented in `docs/change-list.md`.
- **Rollback:** N/A

---

## T6. Error states & loading skeletons
- **Goal:** Specify UX for network failures and loading.
- **Inputs/Decisions:** Error message copy, skeleton design.
- **Proposed file edits:** None (spec only)
- **Acceptance:** Documented patterns and where to apply them.
- **Rollback:** N/A

---

## T7. Integrate SVG region map
- **Goal:** Add SVG map to tracker page and wire up region click filtering.
- **Inputs/Decisions:** Final SVG asset, region ID mapping.
- **Proposed file edits:** `src/components/tracker/RegionMap.tsx`, `src/app/[locale]/tracker-v2/page.tsx`
- **Acceptance:** Clicking a region filters sidebar; map colors reflect completion.
- **Rollback:** Remove SVG integration, revert to static dashboard.

---

## T8. Implement sidebar search/filter/sort
- **Goal:** Add search, region/prefecture filter, and "completed first" toggle to sidebar list.
- **Inputs/Decisions:** Search debounce timing, filter logic, sort order.
- **Proposed file edits:** `src/components/tracker/MountainList.tsx`, `src/hooks/useMountainDirectory.ts`
- **Acceptance:** Sidebar list updates in real time; filters and sort work as specified.
- **Rollback:** Remove new sidebar features, revert to basic list.

---

## T9. Dashboard card implementation
- **Goal:** Implement difficulty, altitude, and total progress cards below map.
- **Inputs/Decisions:** Data aggregation logic, card layout.
- **Proposed file edits:** `src/components/dashboard/DifficultyBreakdown.tsx`, `src/components/dashboard/AltitudeBreakdown.tsx`, `src/components/tracker/TrackerTotalsCard.tsx`, `src/types/dashboard.ts`
- **Acceptance:** Cards show correct aggregates, update with completion state.
- **Rollback:** Remove new cards, revert to old dashboard.

---

## T10. Data loader refactor
- **Goal:** Refactor tracker page to use a single authoritative data loader (RPC-backed).
- **Inputs/Decisions:** Loader API, optimistic update strategy.
- **Proposed file edits:** `src/app/[locale]/tracker-v2/loaders.ts`, `src/hooks/useMountainCompletions.ts`
- **Acceptance:** All tracker widgets read from same dataset; optimistic updates work.
- **Rollback:** Revert to previous client-side state management.

---

## T11. Profile page migration
- **Goal:** Migrate profile page to use RLS-safe view and expose only public fields.
- **Inputs/Decisions:** DB view schema, RLS policy, public field whitelist.
- **Proposed file edits:** DB migration, `src/app/u/[slug]/page.tsx`
- **Acceptance:** Public profile loads securely; no private data exposed.
- **Rollback:** Revert to test user fallback.

---

## T12. i18n coverage for new UI
- **Goal:** Localize all new UI and copy (EN/JA/ZH).
- **Inputs/Decisions:** Final copy, translation sources.
- **Proposed file edits:** `src/lib/i18n/messages/*`, UI components
- **Acceptance:** All new UI is localized; language switch works.
- **Rollback:** Remove new i18n keys, revert to English-only.

---

## T13. Analytics hooks (optional)
- **Goal:** Add event tracking for key actions (climb, share, filter).
- **Inputs/Decisions:** Analytics schema, event names.
- **Proposed file edits:** `src/lib/analytics.ts`, tracker/profile components
- **Acceptance:** Events fire on key actions; data is logged or sent.
- **Rollback:** Remove analytics hooks.

---

## T14. Visual style and asset updates
- **Goal:** Finalize SVG map, badge visuals, dashboard card styles.
- **Inputs/Decisions:** Designer input, asset delivery.
- **Proposed file edits:** Asset folder, dashboard/tracker components
- **Acceptance:** UI matches visual spec; assets load correctly.
- **Rollback:** Revert to previous visuals/assets.

---

## T15. Final QA and polish
- **Goal:** Test all new features, error states, and loading skeletons; fix bugs.
- **Inputs/Decisions:** QA checklist, bug reports.
- **Proposed file edits:** Any affected files
- **Acceptance:** All acceptance criteria met; no regressions.
- **Rollback:** Revert problematic changes.

---

See `open-questions.md` for missing inputs and decisions needed before starting each task.

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
