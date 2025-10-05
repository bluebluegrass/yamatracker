# Tracker v2 Feature Flag

Tracker v2 routes are hidden behind a boolean environment flag so we can iterate safely.

## Enable locally

Add the flag to your environment before starting the dev server:

```bash
export NEXT_PUBLIC_FEATURE_TRACKER_V2=true
npm run dev
```

Visiting `/en/tracker-v2` (or the locale-equivalent path) will load the placeholder shell when the flag is on.

## Disable / default state

Leave the variable unset or set it to any value other than `true` (case sensitive). The route short-circuits with `notFound()`, so new components never mount when the flag is off.

## Notes

- The flag is read via `src/lib/config/features.ts`. Reuse `isTrackerV2Enabled()` to gate additional tracker v2 components.
- Do not expose v2 UI without the flag until the redesign is ready for a wider launch.

## Mountain constants

Altitude buckets and difficulty stars are defined in `src/lib/constants/mountains.ts`. Use `resolveAltitudeBucket()` and `isDifficultyStar()` when wiring dashboard aggregates or validations so the logic stays consistent.

## Supabase altitude view

The migration `supabase/migrations/20250214093000_add_altitude_buckets_view.sql` introduces the `v_altitude_buckets` view and adds a `by_altitude` array to the `dashboard_snapshot` RPC. Any server or client consumer should prefer the RPC payload for altitude counts instead of recomputing on the fly.
