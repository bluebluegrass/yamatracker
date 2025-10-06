import { notFound } from 'next/navigation';
import { isTrackerV2Enabled } from '@/lib/config/features';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TrackerScaffoldPage() {
  if (!isTrackerV2Enabled()) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
        <aside className="lg:w-80">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sidebar</div>
            <p className="mt-3 text-sm text-slate-600">
              Tracker controls &amp; mountain list will live here. For now this is a placeholder
              to validate responsive layout behaviour.
            </p>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Map</div>
            <div className="mt-4 flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-sm font-medium text-slate-500">
              Interactive map placeholder
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dashboards</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-sm font-medium text-slate-500">
                Aggregate card placeholder
              </div>
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-sm font-medium text-slate-500">
                Activity card placeholder
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
