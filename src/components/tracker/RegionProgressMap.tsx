'use client';

import type { KeyboardEvent } from 'react';
import { REGION_SHAPES } from './region-map-shapes';

const REGION_IDS = [
  'Hokkaido',
  'Tohoku',
  'Kanto',
  'Chubu',
  'Kansai',
  'Chugoku',
  'Shikoku',
  'Kyushu',
] as const;

export type RegionId = (typeof REGION_IDS)[number];

export type RegionCounts = Record<
  RegionId,
  {
    completed: number;
    total: number;
  }
>;

interface RegionProgressMapProps {
  regionCounts: Partial<Record<RegionId, { completed: number; total: number }>>;
  activeRegion?: RegionId;
  onRegionChange?: (region?: RegionId) => void;
}

const REGION_COLORS: Record<RegionId, string> = {
  Hokkaido: '#f97373',
  Tohoku: '#facc15',
  Kanto: '#818cf8',
  Chubu: '#34d399',
  Kansai: '#fb923c',
  Chugoku: '#a855f7',
  Shikoku: '#c084fc',
  Kyushu: '#94a3b8',
};

function resolveFillOpacity(completed: number, total: number) {
  if (total <= 0) {
    return 0.18;
  }
  const ratio = Math.min(Math.max(completed / total, 0), 1);
  return 0.22 + ratio * 0.65;
}

function formatLabel(region: RegionId, completed: number, total: number) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return `${region}: ${completed} of ${total} completed (${percent}% done)`;
}

function handleKeyActivate(event: KeyboardEvent<SVGElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
}

export function RegionProgressMap({ regionCounts, activeRegion, onRegionChange }: RegionProgressMapProps) {
  const handleToggle = (region: RegionId) => {
    if (!onRegionChange) {
      return;
    }
    if (activeRegion === region) {
      onRegionChange(undefined);
    } else {
      onRegionChange(region);
    }
  };

  const allTotalsZero = REGION_IDS.every((region) => (regionCounts[region]?.total ?? 0) === 0);

  return (
    <div>
      <div className="relative mx-auto w-full max-w-3xl">
        <svg
          viewBox="0 0 560 745"
          className="h-auto w-full"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Japan map showing completion counts per region"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="560" height="745" fill="#f8fafc" />
          {REGION_IDS.map((region) => {
            const paths = REGION_SHAPES[region];
            const stats = regionCounts[region] ?? { completed: 0, total: 0 };
            const opacity = resolveFillOpacity(stats.completed, stats.total);
            const isActive = activeRegion === region;
            const strokeColor = isActive ? '#1e3a8a' : 'rgba(15, 23, 42, 0.35)';
            const strokeWidth = isActive ? 6 : 3;

            return (
              <g
                key={region}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={formatLabel(region, stats.completed, stats.total)}
                onClick={() => handleToggle(region)}
                onKeyDown={(event) => handleKeyActivate(event, () => handleToggle(region))}
                style={{ cursor: onRegionChange ? 'pointer' : 'default' }}
              >
                <title>{formatLabel(region, stats.completed, stats.total)}</title>
                {paths.map((d, index) => (
                  <path
                    key={`${region}-${index}`}
                    d={d}
                    fill={REGION_COLORS[region]}
                    fillOpacity={opacity}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="transition-all duration-200 ease-in-out"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {REGION_IDS.map((region) => {
          const stats = regionCounts[region] ?? { completed: 0, total: 0 };
          const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          const isActive = activeRegion === region;

          return (
            <button
              key={region}
              type="button"
              onClick={() => handleToggle(region)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                isActive ? 'border-indigo-500 bg-indigo-50/80' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{region}</span>
                <span>{percent}%</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {stats.completed} <span className="text-xs text-slate-500">/ {stats.total}</span>
              </div>
            </button>
          );
        })}
      </div>

      {allTotalsZero && (
        <p className="mt-4 text-sm text-slate-500">
          No region data available yet. Toggle mountains in the sidebar to start tracking progress.
        </p>
      )}
    </div>
  );
}

export const ALL_REGION_IDS = REGION_IDS;
