import { SupabaseClient } from '@supabase/supabase-js';
import { DashboardSnapshot } from '@/types/dashboard';

/**
 * Fetch the complete dashboard snapshot for the authenticated user
 */
export async function getSnapshot(supabase: SupabaseClient): Promise<DashboardSnapshot> {
  const { data, error } = await supabase.rpc('dashboard_snapshot');
  if (error) throw error;
  return data as DashboardSnapshot;
}

/**
 * Toggle a mountain completion and return the fresh snapshot
 */
export async function toggleAndGetSnapshot(
  supabase: SupabaseClient, 
  id: string, 
  mark: boolean
): Promise<DashboardSnapshot> {
  const { data, error } = await supabase.rpc('toggle_completion', { 
    p_mountain_id: id, 
    p_mark: mark 
  });
  if (error) throw error;
  return data as DashboardSnapshot;
}
