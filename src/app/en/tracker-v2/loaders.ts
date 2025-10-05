import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getSnapshot } from '@/lib/supabase/api';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { DashboardSnapshot } from '@/types/dashboard';
import type { Database } from '@/types/supabase';

export async function loadSnapshot(): Promise<DashboardSnapshot> {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const snapshot = await getSnapshot(supabaseAdmin, { userId: user?.id ?? undefined });
  return snapshot;
}
