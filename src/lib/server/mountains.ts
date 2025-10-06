import { cache } from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { CanonicalMountain } from '@/types/mountain';

const SELECT_COLUMNS = [
  'id',
  'name_ja',
  'name_en',
  'name_zh',
  'region',
  'prefecture',
  'elevation_m',
  'difficulty',
].join(', ');

export const getCanonicalMountains = cache(async (): Promise<CanonicalMountain[]> => {
  const { data, error } = await supabaseAdmin
    .from('mountains')
    .select(SELECT_COLUMNS)
    .order('region', { ascending: true })
    .order('name_en', { ascending: true });

  if (error) {
    throw new Error(`[getCanonicalMountains] ${error.message}`, { cause: error });
  }

  return (data ?? []) as unknown as CanonicalMountain[];
});
