// TypeScript contract for the dashboard snapshot
export type RegionStat = { 
  region: string; 
  total: number; 
  completed: number; 
};

export type DifficultyStat = { 
  level: number | null; 
  total: number; 
  completed: number; 
};

export type AltitudeStat = {
  bucket_id: 'lt_1000' | '1000_1999' | '2000_2999' | 'gte_3000';
  label: string;
  min: number | null;
  max: number | null;
  total: number;
  completed: number;
};

export type Badge = {
  key: 'first_step' | 'ten_done' | 'half_way' | 'five_star_climber';
};

export type DashboardSnapshot = {
  total: number;
  completed: number;
  completed_ids: string[];         // mountain ids
  by_region: RegionStat[];
  by_difficulty: DifficultyStat[]; // levels 0..5; null if missing
  by_altitude: AltitudeStat[];
  badges: Badge[];
};
