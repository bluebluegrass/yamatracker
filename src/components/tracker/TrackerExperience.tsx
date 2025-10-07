'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { TrackerSidebar } from './TrackerSidebar';
import { TrackerDashboard } from './TrackerDashboard';
import type { CanonicalMountain } from '@/types/mountain';
import type { DashboardSnapshot } from '@/types/dashboard';
import { toggleMountainAction } from '@/app/[locale]/tracker/actions';
import { useToast } from '@/hooks/useToast';
import {
  ALL_REGION_IDS,
  RegionProgressMap,
  type RegionCounts,
  type RegionId,
} from './RegionProgressMap';
import { TrackerLoadingSkeleton } from './TrackerLoadingSkeleton';

const IS_DEV = process.env.NODE_ENV !== 'production';

function isRegionId(value: string): value is RegionId {
  return (ALL_REGION_IDS as readonly string[]).includes(value as RegionId);
}

function createEmptyRegionCounts(): RegionCounts {
  return ALL_REGION_IDS.reduce<RegionCounts>((acc, region) => {
    acc[region] = { completed: 0, total: 0 };
    return acc;
  }, {} as RegionCounts);
}

type TrackerExperienceProps = {
  locale: string;
  mountains: CanonicalMountain[];
  initialSnapshot: DashboardSnapshot | null;
};

export function TrackerExperience({ locale, mountains, initialSnapshot }: TrackerExperienceProps) {
  const { addToast } = useToast();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(initialSnapshot);
  const [completedIds, setCompletedIds] = useState<string[]>(() => initialSnapshot?.completed_ids ?? []);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [activeRegion, setActiveRegion] = useState<RegionId | undefined>(undefined);
  const [consistencyIssues, setConsistencyIssues] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const completedCount = snapshot?.completed ?? completedIds.length;
  const totalCount = snapshot?.total ?? mountains.length;

  const pendingSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  const mountainById = useMemo(() => {
    const map = new Map<string, CanonicalMountain>();
    mountains.forEach((mountain) => {
      map.set(mountain.id, mountain);
    });
    return map;
  }, [mountains]);

  const localRegionCounts: RegionCounts = useMemo(() => {
    const counts = createEmptyRegionCounts();

    mountains.forEach((mountain) => {
      if (!isRegionId(mountain.region)) {
        return;
      }
      counts[mountain.region].total += 1;
    });

    completedIds.forEach((id) => {
      const mountain = mountainById.get(id);
      if (!mountain || !isRegionId(mountain.region)) {
        return;
      }
      counts[mountain.region].completed += 1;
    });

    return counts;
  }, [completedIds, mountainById, mountains]);

  const regionCounts: RegionCounts = useMemo(() => {
    if (snapshot?.by_region?.length) {
      const counts = createEmptyRegionCounts();
      snapshot.by_region.forEach((entry) => {
        const region = entry.region as RegionId;
        if (!isRegionId(region)) {
          return;
        }
        counts[region] = {
          completed: entry.completed ?? 0,
          total: entry.total ?? 0,
        };
      });
      return counts;
    }

    return localRegionCounts;
  }, [localRegionCounts, snapshot]);

  const handleToggle = (mountainId: string) => {
    if (pendingSet.has(mountainId)) {
      return;
    }

    const isCompleted = completedIds.includes(mountainId);
    const mark = !isCompleted;
    const optimistic = mark
      ? [...completedIds, mountainId]
      : completedIds.filter((id) => id !== mountainId);

    setCompletedIds(optimistic);
    setPendingIds((prev) => [...prev, mountainId]);

    startTransition(async () => {
      try {
        const nextSnapshot = await toggleMountainAction({ locale, mountainId, mark });
        if (nextSnapshot) {
          setSnapshot(nextSnapshot);
          setCompletedIds(nextSnapshot.completed_ids ?? []);
        } else {
          // fallback: reload snapshot to match server truth
          setCompletedIds(optimistic);
        }
      } catch (error) {
        console.error('Failed to toggle mountain', error);
        addToast('Could not update completion. Please try again.', 'error', 3000);
        setCompletedIds((prev) => (isCompleted ? [...prev, mountainId] : prev.filter((id) => id !== mountainId)));
      } finally {
        setPendingIds((prev) => prev.filter((id) => id !== mountainId));
      }
    });
  };

  const sidebarPendingIds = useMemo(() => pendingIds, [pendingIds]);
  const sidebarCompletedIds = useMemo(() => completedIds, [completedIds]);

  const handleSidebarRegionChange = (region?: string) => {
    if (region && isRegionId(region)) {
      setActiveRegion(region);
      return;
    }
    setActiveRegion(undefined);
  };

  const handleMapRegionChange = (region?: RegionId) => {
    setActiveRegion(region);
  };

  const showInitialSkeleton = mountains.length === 0 && snapshot === null;
  const showSnapshotWarning = !snapshot && mountains.length > 0;

  useEffect(() => {
    if (!IS_DEV) {
      return;
    }

    if (pendingIds.length > 0) {
      setConsistencyIssues((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const issues: string[] = [];
    const localCompleted = completedIds.length;
    const aggregatedCompleted =
      snapshot?.completed ??
      ALL_REGION_IDS.reduce((sum, region) => sum + (regionCounts[region]?.completed ?? 0), 0);

    if (aggregatedCompleted !== localCompleted) {
      issues.push(
        `Sidebar shows ${localCompleted} completed, but aggregates report ${aggregatedCompleted}.`
      );
    }

    ALL_REGION_IDS.forEach((region) => {
      const aggregated = regionCounts[region] ?? { completed: 0, total: 0 };
      const local = localRegionCounts[region] ?? { completed: 0, total: 0 };

      if (aggregated.completed !== local.completed) {
        issues.push(
          `${region}: aggregate completed (${aggregated.completed}) does not match sidebar data (${local.completed}).`
        );
      }

      if (aggregated.total !== local.total) {
        issues.push(
          `${region}: aggregate total (${aggregated.total}) does not match canonical list (${local.total}).`
        );
      }
    });

    setConsistencyIssues((prev) => {
      const unchanged =
        prev.length === issues.length && prev.every((value, index) => value === issues[index]);
      return unchanged ? prev : issues;
    });

    if (issues.length > 0) {
      console.warn('[tracker-consistency]', issues);
    }
  }, [completedIds, localRegionCounts, pendingIds, regionCounts, snapshot?.completed]);

  if (showInitialSkeleton) {
    return <TrackerLoadingSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {IS_DEV && consistencyIssues.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Tracker consistency check</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {consistencyIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {showSnapshotWarning && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Snapshot unavailable</p>
          <p className="mt-1">
            We couldn&apos;t load the latest dashboard snapshot. The sidebar still reflects your local selections,
            but totals may be out of date. Try reloading the page after a moment.
          </p>
        </div>
      )}

      <div className="flex w-full flex-col gap-8 lg:flex-row">
        <aside className="lg:w-80">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <TrackerSidebar
              mountains={mountains}
              completedIds={sidebarCompletedIds}
              pendingIds={sidebarPendingIds}
              onToggle={handleToggle}
              activeRegion={activeRegion}
              onRegionChange={handleSidebarRegionChange}
            />
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Map</div>
                <p className="mt-2 text-sm text-slate-600">
                  Click a region on the map (or use the legend) to filter the sidebar and focus your progress.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {completedCount}/{totalCount} complete
              </span>
            </div>
            <div className="mt-4">
              <RegionProgressMap
                regionCounts={regionCounts}
                activeRegion={activeRegion}
                onRegionChange={handleMapRegionChange}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dashboards</div>
              {isPending && <span className="text-xs text-indigo-600">Syncing...</span>}
            </div>
            <div className="mt-4 space-y-6">
              {snapshot ? (
                <TrackerDashboard snapshot={snapshot} />
              ) : (
                <div className="text-sm text-slate-500">No snapshot available.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
