'use client';

import { useMemo, useState, useTransition } from 'react';
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

function isRegionId(value: string): value is RegionId {
  return (ALL_REGION_IDS as readonly string[]).includes(value as RegionId);
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

  const regionCounts: RegionCounts = useMemo(() => {
    if (snapshot?.by_region?.length) {
      return ALL_REGION_IDS.reduce<RegionCounts>((acc, region) => {
        const stat = snapshot.by_region.find((entry) => entry.region === region);
        acc[region] = {
          completed: stat?.completed ?? 0,
          total: stat?.total ?? 0,
        };
        return acc;
      }, {} as RegionCounts);
    }

    const counts = ALL_REGION_IDS.reduce<RegionCounts>((acc, region) => {
      acc[region] = { completed: 0, total: 0 };
      return acc;
    }, {} as RegionCounts);

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
  }, [completedIds, mountainById, mountains, snapshot?.by_region]);

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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
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
  );
}
