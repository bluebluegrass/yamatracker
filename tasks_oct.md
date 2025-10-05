Tracker V2 — Task Playbook (T01–T21)

Run order: T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20 → T21

T01 — Create Work Branch & Guardrails

Do checklist
- [x] Create/ensure branch: feat/tracker-v2.
- [x] Add env flag: NEXT_PUBLIC_FEATURE_TRACKER_V2=true|false.
- [x] Read flag via existing env util (or process.env wrapper).
- [x] Wrap all new tracker pages/components behind the flag.
- [x] Add docs/dev-notes-tracker-v2.md with enable steps.

Testing checklist
- [x] Flag ON → placeholder tracker page mounts.
- [x] Flag OFF → new pages/components do not mount.
- [x] No changes to legacy v0 pages/styles.

Acceptance
- [x] Local run with flag ON shows placeholder; OFF hides entirely.

T02 — Schema Sanity Check & Indexes (no breaking changes)

Do checklist
- [x] Confirm mountains has: id, name_ja, name_en, name_zh, region, prefecture, elevation_m, difficulty.
- [x] Confirm user_mountain_completions unique (user_id, mountain_id).
- [x] Add indexes (if missing): mountains.region, mountains.difficulty, mountains.elevation_m.

Testing checklist
- [x] EXPLAIN on region/difficulty queries shows index usage.
- [x] Unique constraint prevents duplicates in user_mountain_completions.

Acceptance
- [x] All checks pass; no column renames/drops.

T03 — Public Profile Access Path (RLS-safe)

Do checklist
- [x] Add view/RPC to read profile by slug.
- [x] Return only: slug, display_name, avatar_url, created_at (+ is_public gate if present).
- [x] Allow anonymous role to read this path only.
- [x] Ensure private columns remain blocked under RLS.

Testing checklist
- [x] Logged-out request by slug returns only allowed fields.
- [x] Direct table scans of private columns are denied.

Acceptance
- [x] Public, RLS-safe profile read works as specified.

T04 — Aggregation Source of Truth (auth views + public RPCs)

Do checklist

 Authed read paths (respect auth.uid()): region counts, difficulty counts, altitude buckets.

 Public RPCs: same three aggregates by slug.

 No client-side aggregate math.

Testing checklist

 Changing one completion row updates all three aggregates.

 Public RPCs never expose user_id.

Acceptance

 Aggregates consistent for authed + public paths.

T05 — Server Data Layer Contracts

Do checklist

 Create typed server modules: completions (read/write), profiles (public by slug).

 Functions: get aggregates (auth + slug), toggleCompletion, getPublicProfile.

 No imports in pages yet; compile only.

Testing checklist

 TS types OK, functions import without side effects.

 Unit call with mock clients returns expected shapes.

Acceptance

 Compiles clean; contracts ready for wiring.

T06 — Wire Public Profile Page to Real Data (minimal UI)

Do checklist

 Server-render /u/[slug] using T03/T04/T05 functions.

 Show basic profile fields + region aggregates grid.

 “Profile not found” fallback.

Testing checklist

 Logged-out user can open a real slug → sees live region counts.

 Invalid slug → not-found UI.

 No user_id fetch; no client state.

Acceptance

 Minimal, live, public profile works.

T07 — Tracker Route Scaffold (feature-flagged)

Do checklist

 Create /tracker layout with two columns: Sidebar (left), Main (right).

 Main: Map container + Dashboards container.

 Entire route behind T01 feature flag.

Testing checklist

 Flag ON → three labeled placeholders render responsively.

 Flag OFF → page is inaccessible.

Acceptance

 Clean scaffold, no data yet.

T08 — Sidebar (read-only list + search/filter)

Do checklist

 SSR fetch canonical 100 mountains.

 Render: names (JA/EN), region, elevation.

 Add debounced search (names) + region dropdown filter.

 No writes; no toggles.

Testing checklist

 Typing filters instantly (client-only).

 No network requests on keystrokes (uses preloaded list).

Acceptance

 Fast, read-only filtering works.

T09 — Completion Toggle Plumbing (single write path)

Do checklist

 Add checkbox/toggle per row.

 On toggle: call server write (T05) → optimistic update → debounce → rollback on error.

 Prevent duplicate writes on rapid toggles.

 DB remains single source of truth.

Testing checklist

 Rapid toggle does not create dupes.

 DB shows exactly one row per climbed item.

Acceptance

 Toggle UX reliable; DB consistent.

T10 — Aggregates on the Tracker Page (auth)

Do checklist

 Server-fetch region/difficulty/altitude aggregates for /tracker.

 Hydrate once; Sidebar/Map/Dashboards consume the same payloads.

 Recompute after toggles (refetch/invalidate).

Testing checklist

 Toggling 1 item updates all three areas on next render.

 No component-local aggregate math.

Acceptance

 Single aggregate source drives the tracker.

T11 — Placeholder Region Map + Count Overlays

Do checklist

 Inline SVG or boxes, one per region (IDs match mountains.region).

 Label completed/total on each.

 Fill opacity scales linearly with completion %.

 Click filters Sidebar (client-only).

Testing checklist

 Map counts == region aggregate table.

 Clicking toggles region filter; clicking again clears.

 Works without heavy map libs.

Acceptance

 Visual parity with aggregates.

T12 — Dashboards (difficulty + altitude + total)

Do checklist

 Difficulty bars (★..★★★★) from aggregates.

 Altitude buckets from aggregates.

 Total climbed vs 100 (sum of completions).

Testing checklist

 Numbers match DB aggregates for at least two test users.

 No client filtering to compute.

Acceptance

 Cards reflect canonical numbers.

T13 — Consistency Guard (dev-only)

Do checklist

 Dev check:

sum(checked in list) == aggregates.totalCompleted

per-region list counts == map counts

 Log clear warning on mismatch; no prod logs.

Testing checklist

 Correct data → no warnings.

 Forced mismatch → visible dev warning.

Acceptance

 Guard catches desync during dev.

T14 — Error, Loading, and Empty States

Do checklist

 Skeletons for aggregates loading.

 Toggle failure → revert UI + toast.

 Empty state for “no mountains match filter”.

Testing checklist

 Network throttling shows skeletons; errors show toasts.

 Empty filter shows friendly message.

 No half-updated UI.

Acceptance

 Failure modes are clear & non-destructive.

T15 — Landing Page MVP

Do checklist

 Hero + 2–3 value bullets; primary CTAs.

 One visual mock (screenshot/illustration placeholder).

 Link to a sample public profile.

Testing checklist

 Lighthouse ≥ 90 (perf/SEO/a11y).

 CTAs work; sample profile loads.

Acceptance

 Simple, fast, explanatory landing.

T16 — Public Profile V1 Visuals (share card)

Do checklist

 Layout: avatar, display name (fallback slug), total climbed, mini region matrix.

 “Copy link” + subtle share hint.

 Respect is_public → render “private profile” message if false.

Testing checklist

 Copy link copies canonical URL.

 Mobile & desktop readability OK.

Acceptance

 Shareable, privacy-aware card.

T17 — Accessibility & Keyboard Nav

Do checklist

 Sidebar search focusable; list items operable via keyboard; toggles have accessible names.

 Region shapes: ARIA labels with region name + completed/total; focus ring.

 Don’t rely on color only; include text values.

Testing checklist

 Keyboard-only: can toggle items and filter regions.

 Screen reader announces counts and control states.

Acceptance

 Usable without a mouse; SR-friendly.

T18 — E2E Happy Path + CI Hook

Do checklist

 Script: login → open /tracker → toggle three mountains → verify totals → open /u/[slug] → see region counts.

 Add to CI with feature flag ON.

Testing checklist

 CI passes in clean env.

 Break aggregates/toggle flow → CI fails.

Acceptance

 Prevents regressions in core flow.

T19 — Real Region SVG Swap (when asset ready)

Do checklist

 Replace placeholder with final cartoon Japan SVG.

 Map final region IDs to mountains.region.

 Keep same props contract.

Testing checklist

 Visual matches design.

 Counts & opacity unchanged vs placeholder.

 Regions clickable; filters still work.

Acceptance

 Production-ready map visuals.

T20 — Feature Flag Roll-out Checklist

Do checklist

 Verify metrics/console clean; no private field leaks.

 Short release note with known limitations.

 Turn flag ON in staging → verify → turn ON in prod.

Testing checklist

 Staging: no errors/warnings under normal use.

 Prod: no unexpected logs; basic smoke tests pass.

Acceptance

 Stakeholder sign-off; stable after enablement.

T21 — Region Map Visualization (SVG, bound to snapshot)

Do checklist

 Component RegionMap (placeholder first; real asset in T19).

 Props:

regionCounts: Record<RegionId, { completed: number; total: number }>

activeRegion?: RegionId

onRegionChange?: (region?: RegionId) => void

 Bind shapes by stable IDs matching mountains.region.

 Fill opacity = completed / total; include text label “Region completed/total”.

 Click sets region filter; click again clears.

 Keyboard: tabIndex=0, role="button", aria-pressed, Enter/Space toggle.

 Wire /tracker to snapshot state (T20) and re-render after toggle.

Testing checklist

 Map counts == aggregate table exactly.

 Filter syncs Sidebar; clear works.

 Keyboard-only works; SR announces “RegionName: X of Y completed”.

 After a toggle, next render updates counts/opacity without reload.

Acceptance

 Accurate, accessible, interactive map bound to snapshot.
