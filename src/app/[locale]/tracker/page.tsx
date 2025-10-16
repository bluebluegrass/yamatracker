import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { isTrackerV2Enabled } from '@/lib/config/features';
import { getCanonicalMountains } from '@/lib/server/mountains';
import { loadSnapshot } from '@/app/[locale]/tracker-v2/loaders';
import { TrackerExperience } from '@/components/tracker/TrackerExperience';
import { TrackerHeader } from '@/components/tracker/TrackerHeader';
import type { CanonicalMountain } from '@/types/mountain';
import type { DashboardSnapshot } from '@/types/dashboard';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageParams {
  locale: string;
}

export default async function TrackerScaffoldPage({ params }: { params: PageParams }) {
  if (!isTrackerV2Enabled()) {
    notFound();
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userSlug: string | null = null;

  if (user) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('slug')
        .eq('id', user.id)
        .maybeSingle();

      userSlug = profile?.slug ?? null;
    } catch (error) {
      console.error('Tracker scaffold failed to load user slug', error);
    }
  }

  let mountains: CanonicalMountain[] = [];
  let snapshot: DashboardSnapshot | null = null;

  try {
    const [canonicalMountains, serverSnapshot] = await Promise.all([
      getCanonicalMountains(),
      loadSnapshot().catch((error) => {
        console.error('Tracker scaffold failed to load snapshot', error);
        return null;
      }),
    ]);

    mountains = canonicalMountains;
    snapshot = serverSnapshot;
  } catch (error) {
    console.error('Tracker scaffold failed to fetch data', error);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <TrackerHeader
          locale={params.locale}
          user={
            user
              ? {
                  email: user.email,
                  slug: userSlug,
                }
              : undefined
          }
        />
        <TrackerExperience
          locale={params.locale}
          mountains={mountains}
          initialSnapshot={snapshot}
          isAuthenticated={Boolean(user)}
        />
      </div>
    </main>
  );
}
