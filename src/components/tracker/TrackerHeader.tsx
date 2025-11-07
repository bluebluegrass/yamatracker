'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type TrackerHeaderProps = {
  locale: string;
  user?: {
    email?: string | null;
    slug?: string | null;
  };
};

export function TrackerHeader({ locale, user }: TrackerHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    if (isPending) {
      return;
    }
    startTransition(async () => {
      await supabase.auth.signOut();
      router.refresh();
    });
  };

  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-2xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Hyakumeizan Tracker</h1>
        <p className="text-sm text-slate-600">
          Track progress across Japan&apos;s 100 famous mountains.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {user ? (
          <>
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{user.email ?? 'Signed in'}</span>
            </div>
            {user.slug ? (
              <Link
                href={`/${locale}/u/${user.slug}`}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              >
                View profile
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </>
        ) : (
          <>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
