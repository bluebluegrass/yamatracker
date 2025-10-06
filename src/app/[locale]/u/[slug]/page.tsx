import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cache } from 'react';
import ProgressCounter from '@/components/dashboard/ProgressCounter';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getAggregatesBySlug } from '@/lib/server/completions';
import { getPublicProfile } from '@/lib/server/profiles';
import type { CompletionAggregates } from '@/types/aggregates';
import type { PublicProfile } from '@/types/profile';

const fetchProfileData = cache(async (
  slug: string,
): Promise<{ profile: PublicProfile; aggregates: CompletionAggregates } | null> => {
  const profile = await getPublicProfile(supabaseAdmin, slug);
  if (!profile) {
    return null;
  }

  const aggregates = await getAggregatesBySlug(supabaseAdmin, slug);
  if (!aggregates) {
    return null;
  }

  return { profile, aggregates };
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

  if (!data) {
    return {
      title: 'Profile Not Found',
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
  const { slug } = await resolveParams(params);
  const data = await fetchProfileData(slug);

  if (!data) {
    notFound();
  }

  const { profile, aggregates } = data;
  const { completed, total } = getCompletionTotals(aggregates);
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-10">
          <div className="flex flex-col gap-4 text-center">
            <div className="flex justify-center">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.displayName}'s avatar`}
                  className="h-20 w-20 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="h-20 w-20 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-2xl font-semibold">
                  {profile.displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">{profile.displayName}</h1>
              <p className="text-sm text-gray-500 mt-1">@{profile.slug}</p>
            </div>
            <p className="text-gray-600">Member since {formatJoinDate(profile.createdAt)}</p>
            <div className="flex flex-col items-center gap-2">
              <ProgressCounter completedCount={completed} />
              <p className="text-sm text-gray-500">{completionPercent}% complete</p>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Progress by Region</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {aggregates.byRegion.map((region) => (
              <div key={region.region} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <div className="text-sm font-medium text-gray-500">{region.region}</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-gray-900">{region.completed}</span>
                  <span className="text-sm text-gray-500">/ {region.total}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Start Your Own Journey
          </Link>
        </div>
      </div>
    </div>
  );
}
