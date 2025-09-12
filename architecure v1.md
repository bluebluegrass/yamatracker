Revamped Architecture for Hyakumeizan Tracker
The Problem We're Solving
The original architecture was highly optimized for a single "checklist" view. To introduce new features like a map, a detailed timeline, and a public leaderboard, we need to extend the "single source of truth" and "single snapshot" pattern to handle richer data and different views.

High-level Solution
Database: We will expand the user_mountains table to store more than just a completion date. This table will become a central logbook for each user's climbs.

Server-side Logic: We will continue to use Supabase RPCs to perform all complex logic on the server. This ensures data consistency and security. We will introduce new RPCs for updating a climb with details and fetching a global leaderboard. The existing dashboard_snapshot() RPC will be updated to include more data for new badges.

Client-side State: The client will still primarily rely on a single state object (the "snapshot") to render the UI, fetched after any significant data change. This eliminates data drift and makes debugging predictable.

Data Contracts (server)
We will expand the existing database schema and RPCs to support the new features.

1. Database Updates
The user_mountains table will be modified to include a notes column.

-- Update user_mountains table to include a notes field
ALTER TABLE user_mountains
ADD COLUMN notes TEXT NULL;

This will be a nullable field, so existing completions won't be affected.

2. New & Updated RPCs
We will build on the existing RPC pattern:

update_completion(p_mountain_id text, p_hiked_on date, p_notes text, p_user_id uuid)
Purpose: This new function replaces the functionality of editing a date via a separate call. It handles both adding/editing a date and saving notes for a mountain that is already marked as completed.

Behavior: It will update the hiked_on and notes fields for the specified mountain and user. It will then call dashboard_snapshot() and return a fresh, authoritative snapshot.

Return: jsonb of the new DashboardSnapshot.

get_top_climbers()
Purpose: A new function to power the leaderboard. It fetches a list of users, sorted by their number of completed mountains.

Behavior: It performs a join between the users and user_mountains tables, counts the completions for each user, and orders the results in descending order. It will return the top N users.

Return: jsonb of an array of user objects with their completion count.

dashboard_snapshot()
Purpose: The existing function will be updated to include data for new badges and to fetch the notes for each completed mountain.

Behavior: The badge logic will be expanded to support new achievement conditions (e.g., "Complete all mountains in a single region," or "Achieve X number of 5-star climbs").

Return: jsonb of the new, richer DashboardSnapshot.

Frontend Data Flow (Next.js App Router)
The client-side architecture remains a single, coherent state management system.

app/[locale]/dashboard/page.tsx

Fetches the expanded dashboard_snapshot on the server.

Passes the snapshot to a client-side DashboardProvider as initialSnapshot.

DashboardProvider

Holds the snapshot state.

Provides actions to mutate the state (e.g., toggle(id, mark), updateClimb(id, date, notes)).

These actions call the appropriate Supabase RPC (toggle_completion() or update_completion()). On success, the provider replaces its state with the new snapshot returned by the server.

UI Components

Dashboard page renders the new JapanMap and a redesigned list of mountains.

JapanMap component consumes snapshot.by_region to render a colored map.

The new LogbookModal component is triggered from a mountain card and calls the updateClimb action.

A new /leaderboard page fetches data from the get_top_climbers() RPC.

TypeScript Contract
The DashboardSnapshot type will be updated to reflect the additional badge logic and the notes data. A new type will be needed for the leaderboard data.

// src/types/dashboard.ts (Updated)
export type RegionStat = { ... };
export type DifficultyStat = { ... };
export type Badge = { key: string; name: string; description: string; condition: boolean };

export type DashboardSnapshot = {
  total: number;
  completed: number;
  completed_ids: string[];
  by_region: RegionStat[];
  by_difficulty: DifficultyStat[];
  badges: Badge[]; // Expanded to include more badges
  completions: {
    mountain_id: string;
    hiked_on: string | null;
    notes: string | null;
  }[];
};

// New type for leaderboard data
export type TopClimber = {
  username: string;
  slug: string;
  completed_count: number;
};