import { notFound } from 'next/navigation';
import { isTrackerV2Enabled } from '@/lib/config/features';
import { getCanonicalMountains } from '@/lib/server/mountains';
import { loadSnapshot } from '@/app/[locale]/tracker-v2/loaders';
import { TrackerExperience } from '@/components/tracker/TrackerExperience';
import type { CanonicalMountain } from '@/types/mountain';
import type { DashboardSnapshot } from '@/types/dashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageParams {
  locale: string;
}

export default async function TrackerScaffoldPage({ params }: { params: PageParams }) {
  if (!isTrackerV2Enabled()) {
    notFound();
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
      <TrackerExperience locale={params.locale} mountains={mountains} initialSnapshot={snapshot} />
    </main>
  );
}
