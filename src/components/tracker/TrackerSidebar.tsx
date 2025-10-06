'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type { CanonicalMountain } from '@/types/mountain';

const altitudeFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 0,
});

type TrackerSidebarProps = {
  mountains: CanonicalMountain[];
  completedIds: readonly string[];
  pendingIds?: readonly string[];
  onToggle?: (mountainId: string) => void;
};

export function TrackerSidebar({ mountains, completedIds, pendingIds = [], onToggle }: TrackerSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const deferredSearch = useDeferredValue(searchTerm);

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const pendingSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  const regions = useMemo(() => {
    const unique = new Set<string>();
    mountains.forEach((mountain) => {
      if (mountain.region) {
        unique.add(mountain.region);
      }
    });
    return ['all', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'en'))];
  }, [mountains]);

  const filteredMountains = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return mountains.filter((mountain) => {
      if (selectedRegion !== 'all' && mountain.region !== selectedRegion) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = [mountain.name_en, mountain.name_ja, mountain.name_zh]
        .filter(Boolean)
        .map((value) => value.toLowerCase());

      return haystack.some((value) => value.includes(term));
    });
  }, [mountains, deferredSearch, selectedRegion]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Mountains</h2>
          <span className="text-xs font-medium text-slate-500">
            {filteredMountains.length} / {mountains.length}
          </span>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            type="search"
            autoComplete="off"
          />
        </label>

        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Region
          <select
            value={selectedRegion}
            onChange={(event) => setSelectedRegion(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region === 'all' ? 'All regions' : region}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {filteredMountains.map((mountain) => {
            const isCompleted = completedSet.has(mountain.id);
            const isPending = pendingSet.has(mountain.id);

            return (
              <li
                key={mountain.id}
                className={`px-4 py-3 transition ${
                  isCompleted ? 'bg-indigo-50/80' : 'bg-white'
                } ${isPending ? 'opacity-75' : ''}`}
              >
                <label className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={isCompleted}
                      disabled={isPending || !onToggle}
                      onChange={() => onToggle?.(mountain.id)}
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{mountain.name_en}</div>
                      <div className="text-xs text-slate-500">{mountain.name_ja}</div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>{mountain.region}</div>
                    <div>{altitudeFormatter.format(mountain.elevation_m)} m</div>
                  </div>
                </label>
              </li>
            );
          })}

          {filteredMountains.length === 0 && (
            <li className="p-6 text-center text-sm text-slate-500">
              No mountains match the current filters.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
