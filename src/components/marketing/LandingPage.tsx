import Image from 'next/image';
import Link from 'next/link';
import japanMap from '@/../public/japan_map.svg';

const SAMPLE_PROFILE_SLUG = 'public-slug';

type LandingPageProps = {
  locale: string;
};

const featureHighlights = [
  {
    title: 'Track your climbs effortlessly',
    description:
      'Log completions, watch totals update instantly, and plan your next summit with real-time dashboards.',
  },
  {
    title: 'Explore Japan by region',
    description:
      'Use the interactive map to see progress across all eight regions and uncover new mountains to visit.',
  },
  {
    title: 'Share a beautiful public profile',
    description:
      'Publish your progress with a single toggle—friends can follow along without creating an account.',
  },
];

export function LandingPage({ locale }: LandingPageProps) {
  const trackerHref = `/${locale}/tracker`;
  const sampleProfileHref = `/${locale}/u/${SAMPLE_PROFILE_SLUG}`;

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 pb-24 pt-24 lg:flex-row lg:items-center lg:gap-16">
        <section className="flex-1 space-y-8">
          <div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Tracker v2 Preview
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Map your journey through Japan&apos;s 100 Famous Mountains
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-200">
              Yamatracker keeps every climb, completion, and goal in one place. Toggle mountains from the region
              map, watch dashboards update in real time, and share a polished public profile with friends.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href={trackerHref}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              Open the tracker
            </Link>
            <Link
              href={sampleProfileHref}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:border-indigo-400 hover:text-indigo-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              View a sample profile
            </Link>
          </div>

          <dl className="grid gap-6 text-sm text-slate-200 sm:grid-cols-2">
            {featureHighlights.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
                <dt className="text-base font-semibold text-white">{feature.title}</dt>
                <dd className="mt-2 text-slate-300">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="flex-1">
          <div className="relative mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-300">Live snapshot preview</p>
                <p className="mt-2 text-lg font-semibold text-white">Progress dashboards at a glance</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-indigo-200">
                Real data
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl bg-slate-900/80 ring-1 ring-slate-800">
              <Image
                src={japanMap}
                alt="Stylized map of Japan highlighting regional progress"
                className="h-auto w-full saturate-150"
                priority
              />
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Toggle completions from the tracker to light up each region and update totals instantly.
            </p>
          </div>
        </aside>
      </div>

      <footer className="border-t border-slate-800 bg-slate-950/50 py-6 text-center text-xs text-slate-500">
        Built for hikers exploring the Hyakumeizan challenge. Questions?{' '}
        <a href="mailto:team@yamatracker.app" className="text-indigo-300 hover:text-indigo-200">
          team@yamatracker.app
        </a>
      </footer>
    </main>
  );
}
