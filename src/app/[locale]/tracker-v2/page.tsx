import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isTrackerV2Enabled } from '@/lib/config/features';
import { TrackerDashboard } from '@/components/tracker/TrackerDashboard';
import { loadSnapshot } from './loaders';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchSnapshot() {
  try {
    return await loadSnapshot();
  } catch (error) {
    console.error('Tracker v2: failed to load snapshot', error);
    return null;
  }
}

export default async function TrackerV2Page() {
  if (!isTrackerV2Enabled()) {
    notFound();
  }

  const snapshot = await fetchSnapshot();
  if (!snapshot) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-16">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold text-gray-900">Couldn’t load tracker data</h1>
          <p className="text-sm text-gray-600">
            Something went wrong while fetching your latest progress. Please refresh the page or try again later.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to current tracker
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-3 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Tracker v2 Dashboard</h1>
          <p className="text-gray-600">
            Work in progress view powered by the upcoming server snapshot.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
            >
              Back to dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Landing page
            </Link>
          </div>
        </header>

        <TrackerDashboard snapshot={snapshot} />
      </div>
    </main>
  );
}
