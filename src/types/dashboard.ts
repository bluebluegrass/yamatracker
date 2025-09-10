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

export type Badge = {
  key: 'first_step' | 'ten_done' | 'half_way' | 'five_star_climber';
};

export type DashboardSnapshot = {
  total: number;
  completed: number;
  completed_ids: string[];         // mountain ids
  by_region: RegionStat[];
  by_difficulty: DifficultyStat[]; // levels 0..5; null if missing
  badges: Badge[];
};
