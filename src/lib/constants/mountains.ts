export type AltitudeBucket = {
  id: 'lt_1000' | '1000_1999' | '2000_2999' | 'gte_3000';
  label: string;
  min: number | null;
  max: number | null;
};

export const ALTITUDE_BUCKETS: AltitudeBucket[] = [
  { id: 'lt_1000', label: '<1,000 m', min: null, max: 1000 },
  { id: '1000_1999', label: '1,000 – 1,999 m', min: 1000, max: 2000 },
  { id: '2000_2999', label: '2,000 – 2,999 m', min: 2000, max: 3000 },
  { id: 'gte_3000', label: '≥3,000 m', min: 3000, max: null }
];

export function resolveAltitudeBucket(elevationMeters: number | null | undefined): AltitudeBucket | null {
  if (typeof elevationMeters !== 'number' || Number.isNaN(elevationMeters)) {
    return null;
  }

  return ALTITUDE_BUCKETS.find(({ min, max }) => {
    const aboveMin = min === null || elevationMeters >= min;
    const belowMax = max === null || elevationMeters < max;
    return aboveMin && belowMax;
  }) ?? null;
}

export const DIFFICULTY_STARS = ['★', '★★', '★★★', '★★★★'] as const;
export type DifficultyStar = (typeof DIFFICULTY_STARS)[number];

export function isDifficultyStar(value: string | null | undefined): value is DifficultyStar {
  return DIFFICULTY_STARS.includes((value ?? '') as DifficultyStar);
}
