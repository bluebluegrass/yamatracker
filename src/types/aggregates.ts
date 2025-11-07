import type { AltitudeStat, DifficultyStat, RegionStat } from './dashboard';

export type CompletionAggregates = {
  byRegion: RegionStat[];
  byDifficulty: DifficultyStat[];
  byAltitude: AltitudeStat[];
};

export type PublicCompletionAggregates = CompletionAggregates;
