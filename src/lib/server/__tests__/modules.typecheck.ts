import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompletionAggregates } from '@/types/aggregates';
import type { DashboardSnapshot } from '@/types/dashboard';
import type { PublicProfile } from '@/types/profile';
import type { Database } from '@/types/supabase';
import { getAggregates, getAggregatesBySlug, toggleCompletion } from '../completions';
import { getCanonicalMountains } from '../mountains';
import { getPublicProfile } from '../profiles';
import type { CanonicalMountain } from '@/types/mountain';

const mockClient = {} as SupabaseClient<Database>;

async function ensureCompletionsContract() {
  const aggregates = await getAggregates(mockClient);
  const typedAggregates: CompletionAggregates = aggregates;
  void typedAggregates;

  const publicAggregates = await getAggregatesBySlug(mockClient, 'public-slug');
  if (publicAggregates) {
    const byRegion: CompletionAggregates['byRegion'] = publicAggregates.byRegion;
    void byRegion;
  }

  const snapshot = await toggleCompletion(mockClient, 'mt_fuji', true);
  const typedSnapshot: DashboardSnapshot = snapshot;
  void typedSnapshot;
}

async function ensureProfilesContract() {
  const profile = await getPublicProfile(mockClient, 'public-slug');
  const typedProfile: PublicProfile | null = profile;
  void typedProfile;
}

async function ensureMountainsContract() {
  const mountains = await getCanonicalMountains();
  const typedMountains: CanonicalMountain[] = mountains;
  void typedMountains;
}

void ensureCompletionsContract;
void ensureProfilesContract;
void ensureMountainsContract;
