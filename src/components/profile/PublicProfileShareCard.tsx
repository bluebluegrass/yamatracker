'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { ALL_REGION_IDS } from '@/components/tracker/RegionProgressMap';
import type { CompletionAggregates } from '@/types/aggregates';
import type { PublicProfile } from '@/types/profile';

interface PublicProfileShareCardProps {
  profile: PublicProfile;
  aggregates: CompletionAggregates;
  shareUrl: string;
  joinedAtLabel: string;
}

type CopyState = 'idle' | 'success' | 'error';

function getInitials(name: string) {
  if (!name) {
    return '??';
  }
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function PublicProfileShareCard({
  profile,
  aggregates,
  shareUrl,
  joinedAtLabel,
}: PublicProfileShareCardProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [, startTransition] = useTransition();

  const totals = useMemo(() => {
    const completed = aggregates.byRegion.reduce((sum, region) => sum + region.completed, 0);
    const total = aggregates.byRegion.reduce((sum, region) => sum + region.total, 0);
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [aggregates.byRegion]);

  const regionSnapshot = useMemo(() => {
    const lookup = new Map(aggregates.byRegion.map((entry) => [entry.region, entry]));
    return ALL_REGION_IDS.map((region) => {
      const stat = lookup.get(region);
      return {
        region,
        completed: stat?.completed ?? 0,
        total: stat?.total ?? 0,
      };
    });
  }, [aggregates.byRegion]);

  const handleCopy = () => {
    startTransition(() => {
      const run = async () => {
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareUrl);
          } else {
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          }
          setCopyState('success');
          setTimeout(() => setCopyState('idle'), 2500);
        } catch (error) {
          console.error('Failed to copy profile URL', error);
          setCopyState('error');
          setTimeout(() => setCopyState('idle'), 3000);
        }
      };
      void run();
    });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/60 backdrop-blur">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={`${(profile.displayName || profile.slug)}'s avatar`}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-indigo-100 text-lg font-semibold text-indigo-600">
                {getInitials(profile.displayName || profile.slug)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{profile.displayName || profile.slug}</h1>
              <p className="text-sm text-slate-500">@{profile.slug}</p>
            </div>
          </div>

          <div className="mt-6 grid w-full grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{totals.completed}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Mountains</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{totals.total}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{totals.percent}%</p>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-500">{joinedAtLabel}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              Copy profile link
            </button>
            <span
              className="text-xs text-slate-500"
              role="status"
              aria-live="polite"
            >
              {copyState === 'success' && 'Link copied to clipboard.'}
              {copyState === 'error' && 'Unable to copy. Please copy the URL manually.'}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Region snapshot</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {regionSnapshot.map((entry) => {
              const percent = entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0;
              return (
                <div
                  key={entry.region}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm"
                >
                  <p className="font-medium text-slate-900">{entry.region}</p>
                  <p className="mt-2 text-slate-600">
                    <span className="text-base font-semibold text-slate-900">{entry.completed}</span>
                    <span className="text-xs text-slate-500"> / {entry.total}</span>
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${percent}%` }}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{percent}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
