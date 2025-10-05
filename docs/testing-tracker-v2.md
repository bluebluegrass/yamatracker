# Tracker v2 Testing Notes

## Manual verification

1. Export the feature flag and start the dev server:
   ```bash
   NEXT_PUBLIC_FEATURE_TRACKER_V2=true npm run dev
   ```
2. Visit `http://localhost:3000/en/tracker-v2` while authenticated.
3. Confirm the dashboard cards render data from the live `dashboard_snapshot` RPC. Zero values are expected if the account has no completions.
4. Rotate the middleware or Supabase keys to simulate errors only if necessary; the page should render the “Couldn’t load tracker data” fallback when the loader throws.

## Debugging

- Snapshot RPC calls are logged in the server console. Search for `Tracker v2: failed to load snapshot` if the page hits the fallback.
- Use `/api/debug-snapshot` to inspect the raw payload returned by the RPC.
