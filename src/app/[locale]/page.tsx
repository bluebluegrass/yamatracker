'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const t = useTranslations();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          {t('title')}
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Track your progress climbing Japan's 100 Famous Mountains
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Get Started</h2>
          <p className="text-gray-600 mb-6">
            Sign up to start tracking your mountain climbing journey and share your progress with others.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Redirecting to dashboard in a moment...
        </div>

        {/* Language switcher */}
        <div className="mt-8">
          <div className="inline-flex gap-2">
            <Link href="/en" className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              🇬🇧 English
            </Link>
            <Link href="/ja" className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              🇯🇵 日本語
            </Link>
            <Link href="/zh" className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
              🇨🇳 中文
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
