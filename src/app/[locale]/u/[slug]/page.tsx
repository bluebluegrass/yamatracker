import { headers } from 'next/headers';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cache } from 'react';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getAggregatesBySlug } from '@/lib/server/completions';
import { getPublicProfile } from '@/lib/server/profiles';
import { PublicProfileShareCard } from '@/components/profile/PublicProfileShareCard';
import { PrivateProfileNotice } from '@/components/profile/PrivateProfileNotice';
import type { CompletionAggregates } from '@/types/aggregates';
import type { PublicProfile } from '@/types/profile';
import type { DifficultyStat, AltitudeStat, RegionStat } from '@/types/dashboard';

const SAMPLE_PROFILE_SLUG = 'public-slug';

const SAMPLE_REGION_STATS: RegionStat[] = [
  { region: 'Hokkaido', completed: 6, total: 9 },
  { region: 'Tohoku', completed: 8, total: 15 },
  { region: 'Kanto', completed: 10, total: 14 },
  { region: 'Chubu', completed: 20, total: 51 },
  { region: 'Kansai', completed: 4, total: 7 },
  { region: 'Chugoku', completed: 5, total: 8 },
  { region: 'Shikoku', completed: 2, total: 5 },
  { region: 'Kyushu', completed: 7, total: 11 },
];

const SAMPLE_DIFFICULTY_STATS: DifficultyStat[] = [
  { level: 1, completed: 12, total: 18 },
  { level: 2, completed: 10, total: 24 },
  { level: 3, completed: 8, total: 26 },
  { level: 4, completed: 6, total: 18 },
  { level: 5, completed: 2, total: 14 },
];

const SAMPLE_ALTITUDE_STATS: AltitudeStat[] = [
  { bucket_id: 'lt_1000', label: '< 1,000 m', min: null, max: 999, total: 20, completed: 12 },
  { bucket_id: '1000_1999', label: '1,000 – 1,999 m', min: 1000, max: 1999, total: 35, completed: 18 },
  { bucket_id: '2000_2999', label: '2,000 – 2,999 m', min: 2000, max: 2999, total: 35, completed: 20 },
  { bucket_id: 'gte_3000', label: '≥ 3,000 m', min: 3000, max: null, total: 10, completed: 6 },
];

const SAMPLE_PROFILE_FALLBACK: ProfileFetchResult = {
  status: 'public',
  profile: {
    slug: SAMPLE_PROFILE_SLUG,
    displayName: 'Public Explorer',
    avatarUrl: null,
    createdAt: '2023-03-21T00:00:00.000Z',
    isPublic: true,
  },
  aggregates: {
    byRegion: SAMPLE_REGION_STATS,
    byDifficulty: SAMPLE_DIFFICULTY_STATS,
    byAltitude: SAMPLE_ALTITUDE_STATS,
  },
};

type ProfileFetchResult =
  | { status: 'public'; profile: PublicProfile; aggregates: CompletionAggregates }
  | { status: 'private'; slug: string; displayName?: string | null }
  | { status: 'missing' };

const fetchProfileData = cache(async (slug: string): Promise<ProfileFetchResult> => {
  const profile = await getPublicProfile(supabaseAdmin, slug);
  if (profile) {
    const aggregates = await getAggregatesBySlug(supabaseAdmin, slug);
    if (!aggregates) {
      return { status: 'missing' };
    }
    return { status: 'public', profile, aggregates };
  }

  const { data: privateRow } = await supabaseAdmin
    .from('users')
    .select('slug, display_name, is_public')
    .eq('slug', slug)
    .maybeSingle();

  if (!privateRow) {
    if (slug === SAMPLE_PROFILE_SLUG) {
      return SAMPLE_PROFILE_FALLBACK;
    }
    return { status: 'missing' };
  }

  if (privateRow.is_public === false) {
    return {
      status: 'private',
      slug: privateRow.slug,
      displayName: privateRow.display_name,
    };
  }

  return { status: 'missing' };
});

function formatJoinDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function getCompletionTotals(aggregates: CompletionAggregates) {
  const completed = aggregates.byRegion.reduce((sum, region) => sum + region.completed, 0);
  const total = aggregates.byRegion.reduce((sum, region) => sum + region.total, 0);
  return { completed, total };
}

type PageParams = { locale: string; slug: string };

async function resolveParams(params: PageParams | Promise<PageParams>): Promise<PageParams> {
  if (typeof (params as unknown as { then?: unknown }).then === 'function') {
    return params as Promise<PageParams>;
  }
  return params as PageParams;
}

export async function generateMetadata({ params }: { params: PageParams | Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await resolveParams(params);
  const data = await fetchProfileData(slug);

  if (data.status === 'missing') {
    return {
      title: 'Profile Not Found',
    };
  }

  if (data.status === 'private') {
    return {
      title: 'Private Profile',
      description: 'This profile is currently private.',
    };
  }

  const { profile, aggregates } = data;
  const { completed } = getCompletionTotals(aggregates);

  return {
    title: `${profile.displayName}'s Mountain Journey`,
    description: `${profile.displayName} has completed ${completed}/100 mountains in Japan's 100 Famous Mountains challenge.`,
    openGraph: {
      title: `${profile.displayName}'s Mountain Journey`,
      description: `${profile.displayName} has completed ${completed}/100 mountains in Japan's 100 Famous Mountains challenge.`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.displayName}'s Mountain Journey`,
      description: `${profile.displayName} has completed ${completed}/100 mountains in Japan's 100 Famous Mountains challenge.`,
    },
  } satisfies Metadata;
}

export default async function PublicProfilePage({ params }: { params: PageParams | Promise<PageParams> }) {
  const { slug, locale } = await resolveParams(params);
  const data = await fetchProfileData(slug);

  if (data.status === 'missing') {
    notFound();
  }

  if (data.status === 'private') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <PrivateProfileNotice displayName={data.displayName} slug={data.slug} />
          <div className="mt-10 text-center">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              Explore the tracker
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { profile, aggregates } = data;
  const { completed, total } = getCompletionTotals(aggregates);

  const requestHeaders = headers();
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  const shareUrl = `${baseUrl}/${locale}/u/${profile.slug}`;
  const joinedAtLabel = `Joined ${formatJoinDate(profile.createdAt)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-10">
        <PublicProfileShareCard
          profile={profile}
          aggregates={aggregates}
          shareUrl={shareUrl}
          joinedAtLabel={joinedAtLabel}
        />

        <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Progress by Difficulty</h2>
              <p className="mt-2 text-sm text-gray-500">
                How many Hyakumeizan summits you have completed at each star rating.
              </p>
              <div className="mt-6 space-y-4">
                {aggregates.byDifficulty
                  .filter((entry) => typeof entry.level === 'number')
                  .map((entry) => {
                    const percent = entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0;
                    return (
                      <div key={entry.level} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="font-medium text-gray-700">{entry.level}★</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-xl font-semibold text-gray-900">{entry.completed}</span>
                          <span className="text-sm text-gray-500">/ {entry.total}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-indigo-500"
                            style={{ width: `${percent}%` }}
                            aria-hidden
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Progress by Altitude</h2>
              <p className="mt-2 text-sm text-gray-500">
                Distribution of completed peaks across altitude ranges.
              </p>
              <div className="mt-6 space-y-4">
                {aggregates.byAltitude.map((entry) => {
                  const percent = entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0;
                  return (
                    <div key={entry.bucket_id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="font-medium text-gray-700">{entry.label}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-semibold text-gray-900">{entry.completed}</span>
                        <span className="text-sm text-gray-500">/ {entry.total}</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-indigo-500"
                          style={{ width: `${percent}%` }}
                          aria-hidden
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Progress by Region</h2>
            <p className="mt-2 text-sm text-gray-500">
              Breakdown of completions across all eight regions in the challenge.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {aggregates.byRegion.map((region) => {
                const percent = region.total > 0 ? Math.round((region.completed / region.total) * 100) : 0;
                return (
                  <div key={region.region} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="font-medium text-gray-700">{region.region}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-gray-900">{region.completed}</span>
                      <span className="text-sm text-gray-500">/ {region.total}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${percent}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="pb-6 text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Start Your Own Journey
          </Link>
        </div>
      </div>
    </div>
  );
}
