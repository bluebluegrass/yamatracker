'use client';

import {useTranslations} from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import MountainName from '@/components/dashboard/MountainName';
import ProgressCounter from '@/components/dashboard/ProgressCounter';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ToastContainer } from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useMountainCompletions } from '@/hooks/useMountainCompletions';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase/client';

interface Mountain {
  id: string;
  name_ja: string;
  name_en: string;
  name_zh: string;
  region: string;
  prefecture: string;
  elevation_m: number;
}

export default function Dashboard() {
  const t = useTranslations();
  const { user, loading: authLoading } = useAuth();
  const { completedIds, loading: completionsLoading, toggleMountain } = useMountainCompletions();
  const { toasts, removeToast, addToast } = useToast();
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [mountainsData, setMountainsData] = useState<Mountain[]>([]);
  const [mountainsLoading, setMountainsLoading] = useState(true);

  const completedCount = completedIds.length;

  // Fetch mountains from Supabase
  useEffect(() => {
    const fetchMountains = async () => {
      try {
        console.log('Fetching mountains from Supabase...');
        const { data, error } = await supabase
          .from('mountains')
          .select('*')
          .order('id');

        if (error) {
          console.error('Error fetching mountains:', error);
          addToast('Failed to load mountains data', 'error');
        } else {
          console.log('Mountains data loaded:', data?.length, 'mountains');
          setMountainsData(data || []);
        }
      } catch (err) {
        console.error('Error fetching mountains:', err);
        addToast('Failed to load mountains data', 'error');
      } finally {
        setMountainsLoading(false);
      }
    };

    fetchMountains();
  }, [addToast]);

  // Group mountains by region
  const groupedMountains = mountainsData.reduce((acc, mountain) => {
    const region = mountain.region;
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(mountain);
    return acc;
  }, {} as Record<string, Mountain[]>);

  // Define region order for consistent display
  const regionOrder = ['北海道', '東北', '関東', '中部', '関西', '中国', '四国', '九州'];

  // Fetch user slug when user is available
  useEffect(() => {
    const fetchUserSlug = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('slug')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setUserSlug(data.slug);
          }
        } catch (err) {
          console.error('Error fetching user slug:', err);
        }
      }
    };

    fetchUserSlug();
  }, [user]);


  // Show loading state while checking authentication and loading mountains
  if (authLoading || completionsLoading || mountainsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            {t('title')}
          </h1>
          
          {/* Language Switcher and Authentication Status */}
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                <Link
                  href={userSlug ? `/u/${userSlug}` : '#'}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
            </div>
          </div>
        </div>
        
        {/* Progress Counter */}
        <div className="text-center mb-8">
          <ProgressCounter completedCount={completedCount} />
        </div>

        {/* Mountains List - Grouped by Region */}
        <div className="space-y-8">
          {regionOrder.map((region) => {
            const mountains = groupedMountains[region];
            if (!mountains || mountains.length === 0) return null;
            
            return (
              <div key={region} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-indigo-200 pb-2">
                  {region}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {mountains.map((mountain) => (
                    <button 
                      key={mountain.id} 
                      className={`mountain-card p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        completedIds.includes(mountain.id) 
                          ? 'mountain-completed' 
                          : 'mountain-not-completed'
                      }`}
                      style={{
                        backgroundColor: completedIds.includes(mountain.id) ? '#f0fdf4' : 'white',
                        border: completedIds.includes(mountain.id) ? '2px solid #bbf7d0' : '2px solid transparent',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => toggleMountain(mountain.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleMountain(mountain.id);
                        }
                      }}
                      aria-pressed={completedIds.includes(mountain.id)}
                      aria-label={`${mountain.name_ja} (${mountain.name_en}) - ${completedIds.includes(mountain.id) ? 'Completed' : 'Not completed'}`}
                      role="button"
                      tabIndex={0}
                    >
                      <MountainName 
                        nameJa={mountain.name_ja} 
                        done={completedIds.includes(mountain.id)} 
                      />
                      <div className="text-sm text-gray-600 mt-1">{mountain.name_en}</div>
                      <div className="text-xs text-gray-500">{mountain.prefecture} • {mountain.elevation_m}m</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-gray-600">
          {user ? (
            <p>Click on any mountain to mark it as completed! Your progress will be saved automatically.</p>
          ) : (
            <p>Sign up or sign in to save your mountain climbing progress!</p>
          )}
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
