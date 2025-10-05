import React from 'react';
import type { DashboardSnapshot } from '@/types/dashboard';
import { TrackerTotalsCard } from './TrackerTotalsCard';

interface TrackerDashboardProps {
  snapshot: DashboardSnapshot;
}

function DifficultyBreakdown({ snapshot }: { snapshot: DashboardSnapshot }) {
  const byDifficulty = snapshot.by_difficulty.filter((item) => item.total > 0);

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Difficulty</h2>
      <div className="mt-4 space-y-3">
        {byDifficulty.map((stat) => {
          const label = stat.level ?? 0;
          const percent = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;

          return (
            <div key={label}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {`${label}★`}
                  <span className="ml-2 text-xs text-gray-500">
                    {stat.completed}/{stat.total}
                  </span>
                </span>
                <span className="text-xs text-gray-500">{percent}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${percent}%` }}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AltitudeBreakdown({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Altitude</h2>
      <div className="mt-4 space-y-3">
        {snapshot.by_altitude.map((bucket) => {
          const percent = bucket.total > 0 ? Math.round((bucket.completed / bucket.total) * 100) : 0;

          return (
            <div key={bucket.bucket_id}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {bucket.label}
                  <span className="ml-2 text-xs text-gray-500">
                    {bucket.completed}/{bucket.total}
                  </span>
                </span>
                <span className="text-xs text-gray-500">{percent}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${percent}%` }}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TrackerDashboard({ snapshot }: TrackerDashboardProps) {
  if (!snapshot || typeof snapshot.total !== 'number') {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
        <span className="ml-4 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <TrackerTotalsCard total={snapshot.total} completed={snapshot.completed} />
      <DifficultyBreakdown snapshot={snapshot} />
      <AltitudeBreakdown snapshot={snapshot} />
    </div>
  );
}
}
