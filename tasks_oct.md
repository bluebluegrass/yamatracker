Detailed implementation guide for feat/tracker‑v2 tasks (T01 – T21) — with checklist
Checklist for progress tracking

Use the following checklist to mark off each major task as you work through the playbook. Checking an item indicates that all of the detailed steps under that section have been implemented and tested.

- [x] T01 – Create work branch & feature flag

- [x] T02 – Schema sanity check & indexes

- [x] T03 – Public profile access path

- [x] T04 – Aggregation source of truth

- [x] T05 – Server data layer contracts

- [x] T06 – Wire public profile page

- [x] T07 – Tracker route scaffold

- [x] T08 – Sidebar (read‑only list + search/filter)

- [x] T09 – Completion toggle plumbing

- [x] T10 – Aggregates on the tracker page

- [x] T11 – Placeholder region map + count overlays

- [x] T12 – Dashboards (difficulty + altitude + total)

- [x] T13 – Consistency guard (dev‑only)

- [x] T14 – Error, loading, and empty states

- [x] T15 – Landing page MVP

- [x] T16 – Public profile V1 visuals

 T14 – Error, loading, and empty states

 T15 – Landing page MVP

 T16 – Public profile V1 visuals

 T17 – Accessibility & keyboard navigation

 T18 – E2E happy path + CI hook

 T19 – Real region SVG swap

 T20 – Feature flag roll‑out checklist

 T21 – Region map visualization (SVG, bound to snapshot)

Detailed implementation guide for feat/tracker‑v2 tasks (T01 – T21)

The tasks_oct.md file in the feat/tracker‑v2 branch provides a high‑level checklist for building the new tracker. To help an AI pair‑programmer like Codex or Copilot complete the work, this guide expands each task into explicit implementation steps. Where appropriate, it references the original checklist items
github.com
.

T01 – Create work branch & feature flag

Create the branch – On your local checkout of yamatracker, run git checkout -B feat/tracker-v2. Push this branch so others can collaborate.

Add an env flag – In .env.local, add NEXT_PUBLIC_FEATURE_TRACKER_V2=true (or false to disable). This variable must be prefixed with NEXT_PUBLIC_ for Next.js to expose it to client code.

Read the flag in code – Create a small utility in src/lib/config.ts that reads process.env.NEXT_PUBLIC_FEATURE_TRACKER_V2 === 'true' and exports a boolean isTrackerV2Enabled.

Wrap new routes/components – All new pages/components for the tracker (e.g. /tracker, RegionMap, Dashboards) should check isTrackerV2Enabled. If the flag is false, they should either render nothing or return a notFound() call from Next.js.

Document the flag – Add a short docs/dev‑notes‑tracker‑v2.md explaining how to enable the feature flag for local development. List the branch name and environment variable.

Test toggling – With the flag set to true, verify that the placeholder tracker page renders; with it set to false, make sure none of the new code appears
github.com
.

T02 – Schema sanity check & indexes

Verify table columns – Using Supabase’s SQL editor or psql, inspect the mountains table. Ensure it has id, name_ja, name_en, name_zh, region, prefecture, elevation_m and difficulty as described in the checklist
github.com
.

Check the uniqueness constraint – Verify that user_mountain_completions (or user_mountains in earlier schema) has a unique constraint on (user_id, mountain_id). If not, add one via ALTER TABLE user_mountain_completions ADD CONSTRAINT … UNIQUE (user_id,mountain_id);.

Add indexes – Create indexes for frequently filtered columns:

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mountains_region ON mountains(region);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mountains_difficulty ON mountains(difficulty);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mountains_elevation_m ON mountains(elevation_m);

Test – Use EXPLAIN on typical region/difficulty queries to ensure the indexes are used
github.com
, and verify that duplicate completions are rejected by the unique constraint.

T03 – Public profile access path (RLS‑safe)

Create a public_profile view or RPC – Write an SQL CREATE VIEW or CREATE FUNCTION that accepts a slug and returns only allowed fields: slug, display_name, avatar_url, created_at (and is_public if relevant)
github.com
.

Restrict columns via RLS – Ensure the users table has RLS enabled. Create a policy permitting anonymous (role = 'anon') access to select only the view/RPC, not the base table. Block all other columns so private data is never leaked
github.com
.

Test – In a logged‑out environment, call the RPC by slug and ensure it returns only the expected fields. Verify that direct access to private columns fails with a permission denied error
github.com
.

T04 – Aggregation source of truth (auth views + public RPCs)

Write server functions – Create PostgreSQL functions or views that compute:

Region completion counts (for each of the eight regions) for the current user.

Difficulty counts (how many ★, ★★, ★★★, ★★★★ completions).

Altitude buckets, if used.

Expose public versions – For public profile pages, write analogous functions that accept a slug and return the same aggregate data without exposing user_id
github.com
.

Remove client‑side math – Ensure the client never derives aggregates from raw completions. The only source of truth should be these server functions.

Test – Change a completion row and verify that both the authed and public aggregate endpoints reflect the update instantly
github.com
.

T05 – Server data layer contracts

Create typed modules – In src/lib/data, add modules like completions.ts and profiles.ts that wrap Supabase calls. These should export functions such as getAggregates(userId) (or automatically use the current session), getAggregatesBySlug(slug), toggleCompletion(mountainId), and getPublicProfile(slug)
github.com
.

Use proper TypeScript types – Define interfaces in src/types for the aggregate objects and profiles. Import these types in your modules so the functions return strongly typed data.

Avoid side effects – These modules should not import React or Next.js code. They must be pure functions that can be unit‑tested.

Unit tests / mocks – If possible, write simple tests using Jest or vitest to mock Supabase and ensure the functions return the expected shapes
github.com
.

T06 – Wire public profile page

Create the route – In src/app/u/[slug]/page.tsx, write a server component that reads the slug from params and calls your getPublicProfile(slug) and getAggregatesBySlug(slug) functions.

Handle not‑found – If the profile doesn’t exist or is not public, call notFound() or render a “Profile not found” UI.

Render minimal UI – Display the display_name (fall back to the slug if absent) and show a grid of region counts returned by your server functions
github.com
.

Test – As a logged‑out user, open /u/some‑valid‑slug and verify that the profile data renders, and that /u/invalid‑slug shows the not‑found UI
github.com
.

T07 – Tracker route scaffold (feature‑flagged)

Create the route layout – Add a new file src/app/tracker/page.tsx (or layout.tsx and page.tsx depending on your structure). This should return two columns using CSS grid or flexbox: a Sidebar on the left and a main area on the right containing MapPlaceholder and DashboardsPlaceholder.

Check the feature flag – At the top of the server component, check isTrackerV2Enabled. If false, either return null or call notFound(); otherwise render the scaffold.

Placeholders only – At this stage, render simple <div> elements labelled “Map (placeholder)” and “Dashboards (placeholder)”
github.com
. Do not fetch data yet.

Verify flag behaviour – With the env flag off, navigating to /tracker should 404. With it on, the page should show the placeholders responsive to mobile/desktop
github.com
.

T08 – Sidebar (read‑only list + search/filter)

Fetch the mountain list server‑side – In your tracker page, call a server function (or Supabase directly) during getStaticProps or in a React server component to fetch the canonical list of 100 mountains. Do not fetch on the client.

Create a Sidebar component – Pass the list of mountains to a client component that renders rows showing each mountain’s name(s), region and elevation
github.com
.

Implement search and filter – Use React state to manage a search string and selected region. Filter the in‑memory array on each keystroke, but do not trigger new network requests
github.com
. Use a useDebounce hook to avoid re‑rendering on every keypress.

No write operations – Do not implement toggles here. This is purely read‑only filtering.

Test – Confirm that typing quickly filters the list instantly and that changing the region dropdown updates the list. Use the browser’s network panel to ensure no extra requests occur when typing
github.com
.

T09 – Completion toggle plumbing (single write path)

Add a toggle UI – In each row of the sidebar, add a checkbox or switch. Its checked state should come from the aggregated completion data (for example, pass down a completedIds set from getAggregates).

Handle toggling – On change, call toggleCompletion(mountainId) from your completions module. Immediately update local UI state optimistically, then debounce actual server calls to avoid rapid repeats
github.com
. If the server call fails, revert the local state and show a toast.

Prevent duplicates – Disable the toggle while a request is in flight, or track pending toggles to avoid duplicate writes
github.com
.

Verify DB consistency – Ensure that rapid toggling doesn’t create duplicate rows and that there is exactly one row per user/mountain in the completions table
github.com
.

T10 – Aggregates on the tracker page

Fetch aggregates on page load – When rendering the /tracker page, call your getAggregates(userId) function once. Pass the resulting region/difficulty/altitude counts and completedIds into context providers consumed by the sidebar, map and dashboards
github.com
.

Recompute after toggles – Whenever a toggle completes successfully, refetch the aggregates (or invalidate the query in React Query/SWR) so that the map and dashboards update on the next render
github.com
.

Avoid local math – Never recalculate the totals on the client; always rely on the server‑computed values
github.com
.

T11 – Placeholder region map + count overlays

The goal here is to provide a simple, interactive map representation without pulling in a full map library. The checklist calls for inline SVG or boxes representing each region, with completion counts and click‑to‑filter behaviour
github.com
. A clear implementation plan is:

Define region IDs and names – Create a constant array of the eight region IDs ('Hokkaido', 'Tohoku', 'Kanto', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu'). Optionally define friendly names in multiple languages using your i18n system.

Design the placeholder layout:

Start with a simple <svg width="100%" height="auto"> and render eight <rect> elements or <g> groups. Arrange them roughly in the shape of Japan or as a grid (for example, two rows of four).

Alternatively, if SVG feels heavy, render eight <div> boxes in a CSS grid. Use CSS classes to size/position them consistently.

Accept regionCounts and activeRegion props – Your RegionMapPlaceholder component should receive an object like { Kanto: { completed: 3, total: 10 }, … } and an optional activeRegion. It also accepts onRegionChange(region?: RegionId) to notify the parent when a region is selected or cleared.

Compute fill opacity – For each region, compute opacity = completed / total. To avoid invisibility when nothing is completed, clamp the opacity to a minimum (e.g., 0.1 + 0.5 * (completed / total)). Apply this value to the fill-opacity or CSS opacity of the region box
github.com
.

Overlay counts – Inside each box (or <text> element in SVG), display the region name and a count like 3/10. Use relative positioning (x/y attributes in SVG or position: absolute for <div> children) to centre the text.

Add interactivity – To make regions clickable:

Set tabIndex={0} and role="button" on each region element.

Add onClick={() => onRegionChange(activeRegion === id ? undefined : id)} to toggle the filter. When a region is clicked again, pass undefined to clear the filter
github.com
.

Add keyboard handlers: on KeyDown, if the key is Enter or Space, call the same toggle function.

Provide aria-pressed={activeRegion === id} and an aria-label like "Kanto: 3 of 10 completed"
github.com
.

Style the active region – When activeRegion === id, add a border or different fill colour to highlight the selection. This gives clear feedback to keyboard and mouse users.

Integrate with the sidebar filter – In the /tracker page, maintain regionFilter in React state. Pass regionFilter and a setter into the map component. When onRegionChange is called, update regionFilter accordingly and use it to filter the sidebar list.

Update counts after toggles – Because you derive regionCounts from server aggregates, whenever a toggle happens, refetch aggregates and pass the updated counts to the map. The new completed/total values will update the fill opacities and counts automatically.

Common pitfalls – If the map displays but click events do not fire, ensure the overlay text or child elements do not block pointer events (pointer-events: none on the text group). Conversely, if the map cannot show counts because pointer-events: none is set globally, remove it and instead disable pointer events only on the overlay text. This allows the box to remain clickable while still showing counts.

Test – Verify that the map counts exactly match the numbers in your region aggregates table
github.com
. Click a region and observe that the sidebar filters accordingly. Click again to clear the filter. Confirm that the map works on mobile and desktop without using external map libraries
github.com
.

T12 – Dashboards (difficulty + altitude + total)

Difficulty dashboard – Build a component that accepts difficulty counts and renders a row of bars for each level (★, ★★, ★★★, ★★★★). Use relative bar lengths or percentages for visual impact
github.com
.

Altitude dashboard – Define altitude buckets (e.g. <1000 m, 1000–2000 m, >2000 m). Use the aggregated counts to fill bars or charts accordingly.

Total climbed – Display a simple counter like 23/100 using completedIds.length and 100. Add a progress bar if desired.

Reactivity – When the aggregated data updates, ensure these dashboards re‑render automatically.

Testing – Using at least two user accounts with different completion patterns, verify that the dashboards display the correct numbers and that no client‑side recalculation of totals occurs
github.com
.

T13 – Consistency guard (dev‑only)

Implement consistency checks – In development mode (use process.env.NODE_ENV !== 'production'), compute two sums on each render:

The number of checked items in the sidebar.

The totalCompleted value from your aggregates.
If they differ, log a warning or display a red banner in the UI
github.com
.

Verify region counts – For each region, count the number of filtered items in the sidebar and compare it to the regionCounts value. Log mismatches.

Disable in production – Only run these checks in dev to avoid performance overhead and avoid alarming users
github.com
.

Test – Force a mismatch by temporarily altering a local count and confirm that the warning appears. With correct data, the UI should be quiet
github.com
.

T14 – Error, loading, and empty states

- [x] Implemented: full tracker skeleton, toggle failure toast recovery, sidebar empty-state messaging, manual throttling checks.

Skeleton loading states – When fetching aggregates or the mountain list, render skeleton components (e.g. grey boxes or animated placeholders) until data arrives
github.com
.

Toggle failure handling – Wrap your toggle call in a try/catch. If it fails, revert the optimistic update and show a toast notification explaining the error
github.com
.

Empty state – When the search/filter results in zero mountains, display a friendly message and maybe an illustration instead of an empty list
github.com
.

Test – Use network throttling to ensure skeletons display for slow connections, simulate errors to verify toasts, and filter so that no mountains match to see the empty state
github.com
.

T15 – Landing page MVP

- [x] Implemented: new marketing landing component with hero, feature highlights, SVG visual preview, CTA links to tracker and sample profile.

Create src/app/page.tsx – Design a simple landing page with a hero section (title and subtitle), two or three bullet points describing the value of the tracker, and clear call‑to‑action buttons (e.g. “View Tracker” and “See Demo Profile”).

Add a placeholder visual – Use a static image or illustration to hint at the map/dashboard features. You can embed a screenshot of the dashboard or a simple SVG placeholder
github.com
.

Link to a sample profile – Use one of your seed user slugs to demonstrate a public profile. Ensure the link works when clicked.
github.com

Performance and SEO – Run Lighthouse and aim for scores ≥ 90 for performance, accessibility and SEO. Lazy‑load images and add alt text
github.com
.

Test – Verify that the call‑to‑action buttons navigate correctly and the sample profile loads
github.com
.

T16 – Public profile V1 visuals (share card)

- [x] Implemented: shareable profile card with copy link CTA, mini region matrix, difficulty/altitude stats, and private profile notice fallback.

Card layout – Create a component that displays the user’s avatar, display name (or slug if absent), total climbed count, and a mini region matrix (similar to the placeholder map but much smaller)
github.com
.

Copy link – Add a button labelled “Copy link” that copies the canonical profile URL to the clipboard and shows a confirmation toast
github.com
.

Privacy check – Respect the is_public field: if false, render a “Private profile” message instead of the card
github.com
.

Test – Verify that the link copies correctly, that the component is readable on mobile and desktop, and that private profiles show the correct message
github.com
.

T17 – Accessibility & keyboard navigation

Focus management – Ensure that the search input in the sidebar is focusable via tab and that list items can be navigated with arrow keys or tab stops. Each toggle should have an accessible label describing the mountain
github.com
.

Map accessibility – Each region shape/box must have an aria-label describing the region name and its counts, and use role="button" and aria-pressed to indicate toggle state. Provide a visible focus ring when a region is focused
github.com
.

Colour contrast – Do not rely solely on colour to convey information. The count labels (e.g. 3/10) should always be visible, and there should be sufficient colour contrast between completed and incomplete regions
github.com
.

Test – Using only the keyboard, make sure you can search, toggle completions and filter by region. Use a screen reader to verify that counts and toggle state are announced
github.com
.

T18 – E2E happy path + CI hook

Write an E2E script – Use a tool like Playwright or Cypress. The script should:

Log in as a test user.

Navigate to /tracker (with the feature flag enabled).

Toggle three different mountains and verify that totals and region counts update.

Visit /u/[slug] for the same user and verify that the region counts reflect the toggles
github.com
.

Integrate into CI – Add this script to your CI pipeline so it runs on every pull request when the feature flag is on
github.com
.

Test – Ensure that the script passes in a clean environment and fails if you intentionally break the aggregate or toggle logic.
github.com

T19 – Real region SVG swap

Obtain final asset – Once the design team provides the final SVG of Japan with region shapes, save it in the repo (e.g. public/japan_regions.svg).

Replace placeholder – In your RegionMap component, swap the simplified boxes with the actual <path> elements from the final SVG. Ensure each region path has a stable id matching mountains.region values
github.com
.

Keep the same props contract – Keep using the same regionCounts, activeRegion and onRegionChange props. The logic for opacity, counts and click handling remains unchanged
github.com
.

Test – Compare the new map visually against the design. Verify that counts and opacity match the placeholder implementation and that clicking a region still filters the sidebar
github.com
.

T20 – Feature flag roll‑out checklist

Verify logs and metrics – Before enabling the feature in staging, ensure there are no console errors and that server logs don’t leak private data
github.com
.

Write release notes – Prepare a short document summarizing the new tracker features and any known limitations
github.com
.

Gradual enablement – Turn the flag on in staging, perform smoke tests (especially the happy path from T18), then enable in production
github.com
.

Monitor production – Watch for errors or performance regressions. Be prepared to turn off the flag if issues arise
github.com
.

T21 – Region map visualization (SVG, bound to snapshot)

This final task unifies the earlier work into a polished and accessible RegionMap component
github.com
.

Create a reusable RegionMap component – Accept the props defined in the checklist:

type RegionMapProps = {
  regionCounts: Record<RegionId, { completed: number; total: number }>;
  activeRegion?: RegionId;
  onRegionChange?: (region?: RegionId) => void;
};


Bind shapes to region IDs – Use the final SVG paths for each region. Set data-region="Kanto" (or similar) on each path so you can map counts to the correct shape
github.com
.

Compute opacity and labels – As in T11, compute opacity = completed / total and display the “completed/total” text either inside the region path or with absolutely positioned <span>s
github.com
.

Interactive selection – On click or keyboard activation, call onRegionChange. When activeRegion matches the region ID, highlight it and set aria-pressed
github.com
.

Keyboard accessibility – Give each region tabIndex={0}, role="button" and handle Enter/Space for toggling
github.com
.

Wire to snapshot state – On the /tracker page, maintain activeRegion in state. When a toggle is completed, refetch the snapshot and update both the region map and the sidebar. Use React context or props drilling to share the state
github.com
.

Test – Ensure the map counts match the aggregate table, filtering works in both directions (map → sidebar and sidebar → map), and keyboard-only users can operate it
github.com
. Confirm that after a completion toggle, the map updates without a full page reload.
github.com

Summary and next steps

The steps above break down each high‑level task in tasks_oct.md into concrete actions. Completing them sequentially will produce a fully functional, accessible tracker page with region‑based filtering, aggregate dashboards, a public profile system and a feature‑flagged rollout. Once the placeholder map (T11) is working as described, integrate the final SVG asset (T19) and convert the placeholder component into the final RegionMap (T21). Always test interactions (clicking, keyboard navigation, toggling) and ensure that counts remain consistent with the database across authed and public views.
