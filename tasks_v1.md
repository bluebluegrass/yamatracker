tasks.md — A step-by-step guide to revamp the website.

This guide assumes the architecture.md has been reviewed and accepted. It follows a phased approach, building from the database and API up to the UI.

Phase 1 — Database & RPCs
Goal: Modify the backend to support new features.

Update user_mountains Table:

Add a new notes column of type TEXT to the user_mountains table. This is where users' written notes about a climb will be stored.

Add RLS policies to the new column, so only the user who created the note can view and edit it. This can be done by extending the existing RLS policy Users manage their own check-ins.

Create update_completion RPC:

Create a new Supabase RPC in db/views_and_rpcs.sql named update_completion.

This function will take p_mountain_id (TEXT), p_hiked_on (DATE), and p_notes (TEXT) as input.

It will find the corresponding user_mountains row using the authenticated user's ID (auth.uid()) and p_mountain_id.

It will update the hiked_on and notes fields.

It will then call dashboard_snapshot() and return the fresh snapshot.

Add the necessary GRANT EXECUTE permission for authenticated users.

Update dashboard_snapshot RPC:

Modify the dashboard_snapshot RPC in db/views_and_rpcs.sql.

Ensure it now fetches the hiked_on and notes for each completed mountain in a new completions array.

Expand the badge logic to include new achievement conditions (e.g., "Complete all 5 mountains in region 'Hokkaido'", "Climb 3 mountains with difficulty of '★★★★'").

Create get_top_climbers RPC:

Create a new Supabase RPC in db/views_and_rpcs.sql named get_top_climbers.

This function will perform a JOIN between the users and user_mountains tables.

It will COUNT the user_mountains by user_id, ORDER BY the count in descending order, and LIMIT the results (e.g., to 25).

It will return a jsonb array of objects containing username, slug, and completed_count.

Add the necessary GRANT EXECUTE permission.

Phase 2 — Client-Side Logic & Components
Goal: Build the new UI components and integrate them into the app.

Update src/types/dashboard.ts:

Update the DashboardSnapshot type to include the new completions field, which will be an array of objects holding mountain_id, hiked_on, and notes.

Define a new TopClimber type for the leaderboard data.

Create src/components/dashboard/LogbookModal.tsx:

This new component will be a modal that renders a form for hiked_on and a textarea for notes.

It will take mountainId, mountainName, currentDate, and currentNotes as props to pre-populate the form.

The "Save" button will call the new update_completion RPC via the DashboardProvider.

Create src/components/dashboard/JapanMap.tsx:

This new component will render an SVG of Japan, with individual paths for each region.

It will accept the snapshot.by_region as a prop.

It will use inline styles to dynamically change the fill color of each region's SVG path based on its completion percentage.

Add hover states to display a tooltip with the region name and progress.

Create src/components/Leaderboard.tsx:

This new component will be responsible for fetching and displaying data from the get_top_climbers RPC.

It will render a ranked list of the top climbers with their rank, username, and completed count.

Phase 3 — Integration & Revamped UI
Goal: Integrate new components into the existing pages and improve user flow.

Redesign src/app/[locale]/dashboard/page.tsx:

Import and prominently place the JapanMap component.

Re-style the layout to accommodate the map and existing progress cards.

Modify the mountain card component to add an "edit" icon or a button that opens the LogbookModal.

Redesign src/app/u/[slug]/page.tsx:

Replace the existing QR code and download button with a single "Share Progress" button.

Clicking this button will open a modal that contains all sharing options (download image, copy link, social sharing).

Create New Leaderboard Page:

Create a new page in src/app/[locale]/leaderboard/page.tsx that renders the Leaderboard.tsx component.

Add a new link to the main navigation for this page.

Update ShareImageGenerator.tsx:

Modify this component to include a small, stylized version of the JapanMap with a color-coded representation of the user's progress. This will make the shareable image more visually rich and informative.

Phase 4 — Final Touches
Goal: Ensure a smooth, bug-free, and accessible user experience.

Refine UI/UX:

Ensure all new components are fully responsive across desktop and mobile.

Add loading states for API calls and empty states for leaderboards.

Ensure all buttons and interactive elements have appropriate aria attributes for accessibility.

Update toast messages to be more specific to the new update_completion action.

Internationalization (i18n):

Add all new strings (e.g., "Notes," "Save Notes," "Leaderboard") to the en.json, ja.json, and zh.json files.

Cleanup:

Remove any old code that is no longer needed.