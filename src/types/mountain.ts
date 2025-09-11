// Types for mountain completion data
export interface MountainCompletion {
  mountain_id: string;
  completed_at: string; // existing timestamp
  hiked_on: string | null; // NEW: 'YYYY-MM-DD' format, nullable
}

// Extended interface for mountain cards with completion data
export interface MountainWithCompletion {
  id: string;
  name_ja: string;
  name_en: string;
  name_zh: string;
  region: string;
  prefecture: string;
  elevation_m: number;
  difficulty: string;
  completed_at?: string;
  hiked_on?: string | null;
}
