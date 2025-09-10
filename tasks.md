tasks.md — Step-by-step with debug checkpoints

v0 (region card grid + top counter) already exists. We now implement v0.5 using the snapshot pattern. Do tasks in order; stop after each task.

Phase 2.5 — Snapshot plumbing & UI
Task 1 — Create RPCs and indexes (DB)

Goal: install dashboard_snapshot() and toggle_completion() and verify outputs.

 Run the SQL blocks from architecture.md (views, functions, grants).

 Add helpful indexes if missing:

create index if not exists idx_um_user on user_mountains(user_id);
create index if not exists idx_um_mountain on user_mountains(mountain_id);


Acceptance / Debug

In Supabase SQL editor: select dashboard_snapshot();

Check JSON contains: total=100, arrays populated, counts sane.

Try select toggle_completion('mt_yotei', true); then dashboard_snapshot() again → counts changed.

Task 2 — Server fetcher & types

Goal: centralize a single, typed fetch.

 Add types/dashboard.ts with DashboardSnapshot types (above).

 Add lib/supabase/api.ts with getSnapshot() & toggleAndGetSnapshot() (above).
Acceptance / Debug

Temporary server route /api/debug-snapshot returns the JSON from getSnapshot() (delete later).

Task 3 — DashboardProvider (client store)

Goal: one store that owns the snapshot and exposes toggle().

 components/dashboard/DashboardProvider.tsx (client):

React context: { snapshot, actions: { toggle(id, mark) } }

toggle() calls toggleAndGetSnapshot(); on success, replace snapshot.

Add optional debug logs around RPC duration & returned completed.
Acceptance / Debug

Simple dev page prints snapshot.completed and a “fake toggle” button → number updates.

Task 4 — Wire the page

Goal: server page fetch snapshot once, pass to provider.

 In app/[locale]/(main)/dashboard/page.tsx:

Server: const snapshot = await getSnapshot(serverSupabase)

Render:

<DashboardProvider initialSnapshot={snapshot}>
  <ProgressOverview/>
  <TwoPane>
    <ChecklistSidebar/>
    <RegionTiles/>
  </TwoPane>
  <FooterProgress/>
</DashboardProvider>


Acceptance / Debug

Page loads with real numbers from DB.

Refresh = same numbers (persisted).

Task 5 — ChecklistSidebar

Goal: pure presentational list bound to store.

 Read snapshot.completed_ids to mark checked states.

 On checkbox change → actions.toggle(id, mark).

 (Optional) Search/filter textbox.
Acceptance / Debug

Toggling a box updates all of:

list checkmark,

ProgressOverview numbers,

RegionTiles counts,

Badges / Difficulty bars (once implemented).

Task 6 — DifficultyBreakdown

Goal: read snapshot.by_difficulty and render bars.

 No independent fetch/derive; only use store snapshot.
Acceptance / Debug

After toggling in Sidebar, bars update immediately.

Task 7 — BadgeDisplay

Goal: read snapshot.badges and render icons/labels.

 Badge keys map to i18n labels/icons.
Acceptance / Debug

After hitting thresholds (1, 10, 50, any 5★), badges appear without refresh.

Task 8 — RegionTiles

Goal: read snapshot.by_region and render 8 tiles.

 Tile color = completion %; click/hover emits region filter to Sidebar (optional).
Acceptance / Debug

Toggling mountains in a region updates that tile’s counts.

Phase 3 — Hardening
Task 9 — Error & loading states

 Provider tracks isMutating, lastError.

 Disable checkboxes during toggle; show toast on error; on failure do not mutate local snapshot.
Acceptance / Debug

Simulate network failure (turn off Supabase) → UI shows toast, state stays consistent.

Task 10 — A11y & i18n

 Keyboard interactions for Sidebar; aria attributes on checkboxes and bars.

 Strings added to i18n bundles.

Phase 4 — Sharing
Task 11 — JapanOutline (share-only)

 components/share/JapanOutline.tsx shades each region using snapshot.by_region.

 ShareImageGenerator.tsx composes username, X/100, QR, and JapanOutline.
Acceptance / Debug

Manually generate a PNG; colors match the RegionTiles numbers.

Task 12 — /api/og

 Use same composition server-side; return image for OG.

Phase 5 — Cleanup
Task 13 — Remove debug route, keep feature flag for logs
Task 14 — Docs: add “How to debug snapshot” (run RPCs in SQL editor)
Golden rules (to avoid going in circles)

No component does its own fetch or independent calculations.

Every UI change comes from replacing the single snapshot returned by the server.

Never “optimistically” edit the snapshot locally. Wait for RPC → replace.

If numbers don’t match, call select dashboard_snapshot(); in SQL editor and compare with what the UI shows—if SQL is right, the bug is in the client; if SQL is wrong, fix it in one place.