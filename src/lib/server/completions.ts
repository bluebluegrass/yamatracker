import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompletionAggregates } from '@/types/aggregates';
import type { DashboardSnapshot, AltitudeStat, DifficultyStat, RegionStat } from '@/types/dashboard';
import type { Database } from '@/types/supabase';

const RPC_GET_REGION = 'get_region_counts';
const RPC_GET_DIFFICULTY = 'get_difficulty_counts';
const RPC_GET_ALTITUDE = 'get_altitude_counts';
const RPC_GET_PUBLIC_REGION = 'get_public_region_counts';
const RPC_GET_PUBLIC_DIFFICULTY = 'get_public_difficulty_counts';
const RPC_GET_PUBLIC_ALTITUDE = 'get_public_altitude_counts';
const RPC_TOGGLE_COMPLETION = 'toggle_completion';

type AnyClient = SupabaseClient<Database>;

type RegionRow = RegionStat;
type DifficultyRow = {
  difficulty: number | null;
  total: number;
  completed: number;
};
type AltitudeRow = {
  bucket_id: AltitudeStat['bucket_id'];
  label: string;
  min: number | null;
  max: number | null;
  total: number;
  completed: number;
};

type PublicRegionRow = RegionRow;
type PublicDifficultyRow = DifficultyRow;
type PublicAltitudeRow = AltitudeRow;

function toRegionStats(rows: RegionRow[] | null | undefined): RegionStat[] {
  return (rows ?? []).map((row) => ({ ...row }));
}

function toDifficultyStats(rows: DifficultyRow[] | null | undefined): DifficultyStat[] {
  return (rows ?? []).map((row) => ({
    level: row.difficulty,
    total: row.total,
    completed: row.completed,
  }));
}

function toAltitudeStats(rows: AltitudeRow[] | null | undefined): AltitudeStat[] {
  return (rows ?? []).map((row) => ({
    bucket_id: row.bucket_id,
    label: row.label,
    min: row.min,
    max: row.max,
    total: row.total,
    completed: row.completed,
  }));
}

async function callRpc<T>(client: AnyClient, fn: string, params?: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await client.rpc(fn as never, (params ?? {}) as never);
  if (error) {
    throw new Error(`[${fn}] ${error.message}`, { cause: error });
  }
  return (data as T | null) ?? null;
}

export async function getAggregates(client: AnyClient): Promise<CompletionAggregates> {
  const [regionRows, difficultyRows, altitudeRows] = await Promise.all([
    callRpc<RegionRow[]>(client, RPC_GET_REGION),
    callRpc<DifficultyRow[]>(client, RPC_GET_DIFFICULTY),
    callRpc<AltitudeRow[]>(client, RPC_GET_ALTITUDE),
  ]);

  return {
    byRegion: toRegionStats(regionRows ?? []),
    byDifficulty: toDifficultyStats(difficultyRows ?? []),
    byAltitude: toAltitudeStats(altitudeRows ?? []),
  };
}

export async function getAggregatesBySlug(client: AnyClient, slug: string): Promise<CompletionAggregates | null> {
  const sanitized = slug.trim();
  if (!sanitized) {
    return null;
  }

  const params = { p_slug: sanitized };
  const [regionRows, difficultyRows, altitudeRows] = await Promise.all([
    callRpc<PublicRegionRow[]>(client, RPC_GET_PUBLIC_REGION, params),
    callRpc<PublicDifficultyRow[]>(client, RPC_GET_PUBLIC_DIFFICULTY, params),
    callRpc<PublicAltitudeRow[]>(client, RPC_GET_PUBLIC_ALTITUDE, params),
  ]);

  const hasData = Boolean(regionRows && regionRows.length);
  if (!hasData) {
    return null;
  }

  return {
    byRegion: toRegionStats(regionRows),
    byDifficulty: toDifficultyStats(difficultyRows),
    byAltitude: toAltitudeStats(altitudeRows),
  };
}

export async function toggleCompletion(
  client: AnyClient,
  mountainId: string,
  mark: boolean,
): Promise<DashboardSnapshot> {
  const trimmedId = mountainId.trim();
  if (!trimmedId) {
    throw new Error('toggleCompletion requires a non-empty mountain id');
  }

  const { data, error } = await client.rpc(RPC_TOGGLE_COMPLETION as never, {
    p_mountain_id: trimmedId,
    p_mark: mark,
  } as never);

  if (error) {
    throw new Error(`[${RPC_TOGGLE_COMPLETION}] ${error.message}`, { cause: error });
  }

  if (!data) {
    throw new Error('toggle_completion returned no data');
  }

  return data as DashboardSnapshot;
}
