'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { toggleCompletion } from '@/lib/server/completions';
import type { DashboardSnapshot } from '@/types/dashboard';

interface TogglePayload {
  locale: string;
  mountainId: string;
  mark: boolean;
}

export async function toggleMountainAction({ locale, mountainId, mark }: TogglePayload): Promise<DashboardSnapshot | null> {
  const supabase = createServerActionClient<Database>({ cookies });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Authentication required to toggle completions.');
  }

  const snapshot = await toggleCompletion(supabase, mountainId, mark);
  revalidatePath(`/${locale}/tracker`);
  revalidatePath(`/${locale}/dashboard`);
  return snapshot;
}
