/**
 * Global feature flags for conditional rollouts.
 */
export const FEATURE_TRACKER_V2 = process.env.NEXT_PUBLIC_FEATURE_TRACKER_V2 === 'true';

/**
 * Convenience helper to check if tracker v2 should render.
 */
export function isTrackerV2Enabled(): boolean {
  return FEATURE_TRACKER_V2;
}
