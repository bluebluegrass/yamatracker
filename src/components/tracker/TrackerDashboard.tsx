import { Fragment } from 'react';
import type { DashboardSnapshot, RegionStat, DifficultyStat, AltitudeStat } from '@/types/dashboard';
import { TrackerTotalsCard } from './TrackerTotalsCard';

type BreakdownProps<T> = {
  title: string;
  stats: T[];
  totalExtractor: (item: T) => number;
  completedExtractor: (item: T) => number;
  labelExtractor: (item: T) => React.ReactNode;
};

function StatBreakdown<T>({ title, stats, totalExtractor, completedExtractor, labelExtractor }: BreakdownProps<T>) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      <div className="mt-4 space-y-3">
        {stats.map((stat, index) => {
          const total = totalExtractor(stat);
          const completed = completedExtractor(stat);
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <div key={index}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {labelExtractor(stat)}
                  <span className="ml-2 text-xs text-gray-500">
                    {completed}/{total}
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

function RegionBreakdown({ stats }: { stats: RegionStat[] }) {
  return (
    <StatBreakdown
      title="Regions"
      stats={stats.filter((entry) => entry.total > 0)}
      totalExtractor={(entry) => entry.total}
      completedExtractor={(entry) => entry.completed}
      labelExtractor={(entry) => entry.region}
    />
  );
}

function DifficultyBreakdown({ stats }: { stats: DifficultyStat[] }) {
  return (
    <StatBreakdown
      title="Difficulty"
      stats={stats.filter((entry) => entry.total > 0)}
      totalExtractor={(entry) => entry.total}
      completedExtractor={(entry) => entry.completed}
      labelExtractor={(entry) => (
        <Fragment>
          {(entry.level ?? 0)}★
        </Fragment>
      )}
    />
  );
}

function AltitudeBreakdown({ stats }: { stats: AltitudeStat[] }) {
  return (
    <StatBreakdown
      title="Altitude"
      stats={stats}
      totalExtractor={(entry) => entry.total}
      completedExtractor={(entry) => entry.completed}
      labelExtractor={(entry) => entry.label}
    />
  );
}

interface TrackerDashboardProps {
  snapshot: DashboardSnapshot;
}

export function TrackerDashboard({ snapshot }: TrackerDashboardProps) {
  if (!snapshot || typeof snapshot.total !== 'number') {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600" />
        <span className="ml-4 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <TrackerTotalsCard total={snapshot.total} completed={snapshot.completed} />
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Badges</h2>
          <ul className="mt-4 grid gap-2 text-sm text-gray-600">
            {snapshot.badges.length === 0 && <li className="text-gray-500">No badges yet. Keep hiking!</li>}
            {snapshot.badges.map((badge) => (
              <li key={badge.key} className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                  {badge.key.slice(0, 2).toUpperCase()}
                </span>
                <span className="font-medium text-gray-700">{badge.key}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Completed IDs</h2>
          <p className="mt-4 text-xs text-gray-500">{snapshot.completed_ids.length} mountains tracked.</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <RegionBreakdown stats={snapshot.by_region} />
        <DifficultyBreakdown stats={snapshot.by_difficulty} />
        <AltitudeBreakdown stats={snapshot.by_altitude} />
      </div>
    </>
  );
}
