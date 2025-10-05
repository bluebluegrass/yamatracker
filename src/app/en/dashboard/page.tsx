// English-only dashboard page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MountainName from '@/components/dashboard/MountainName';
import ProgressCounter from '@/components/dashboard/ProgressCounter';
import DifficultyBreakdown from '@/components/dashboard/DifficultyBreakdown';
import BadgeDisplay from '@/components/dashboard/BadgeDisplay';
import MountainDateDisplay from '@/components/dashboard/MountainDateDisplay';
import { ToastContainer } from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useMountainCompletions } from '@/hooks/useMountainCompletions';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase/client';

interface Mountain {
  id: string;
  name_en: string;
  region: string;
  prefecture: string;
  elevation_m: number;
  difficulty: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { completedIds, completionData, loading: mountainsLoading, toggleMountain, setCompletionDate, getCompletionData } = useMountainCompletions();
  const { toasts, removeToast, addToast } = useToast();
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [mountainsData, setMountainsData] = useState<Mountain[]>([]);
  const [mountainsDataLoading, setMountainsDataLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const completedCount = completedIds.length;

  // Group mountains by region
  const groupedMountains = mountainsData.reduce((acc: Record<string, Mountain[]>, mountain: Mountain) => {
    const region = mountain.region;
    if (!acc[region]) {
      acc[region] = [];
    }
    acc[region].push(mountain);
    return acc;
  }, {} as Record<string, Mountain[]>);

  // Define region order for consistent display
  const regionOrder = ['Hokkaido', 'Tohoku', 'Kanto', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu'];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMountainsDataLoading(false);
      setLoadingTimeout(true);
    }, 10000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const fetchMountains = async () => {
      try {
        const { data, error } = await supabase
          .from('mountains')
          .select('*')
          .order('id');
        if (error) {
          addToast('Failed to load mountains data', 'error', 3000);
        } else {
          setMountainsData(data || []);
        }
      } catch (err) {
        addToast('Network error loading mountains', 'error', 3000);
      } finally {
        setMountainsDataLoading(false);
      }
    };
    fetchMountains();
  }, [addToast]);

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
        } catch (err) {}
      }
    };
    fetchUserSlug();
  }, [user]);

  if ((authLoading || mountainsLoading || mountainsDataLoading) && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
          {loadingTimeout && <div className="text-sm text-gray-500 mt-2">Loading timeout - showing partial data</div>}
        </div>
      </div>
    );
  }

  if (!mountainsDataLoading && mountainsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600">Failed to load mountains data</div>
          <div className="text-sm text-gray-500 mt-2">Please check your connection and try again</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Japan's 100 Famous Mountains Tracker</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                <Link href={userSlug ? `/u/${userSlug}` : '#'} className="text-sm text-indigo-600 hover:text-indigo-500">View Profile</Link>
                <button onClick={() => window.location.href = '/login'} className="text-sm text-indigo-600 hover:text-indigo-500">Sign Out</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">Sign In</Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Sign Up</Link>
              </div>
            )}
            </div>
          </div>
        </div>
        <div className="text-center mb-8">
          <ProgressCounter completedCount={completedCount} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DifficultyBreakdown mountains={mountainsData} completedIds={completedIds} />
          <BadgeDisplay completedCount={completedCount} completedIds={completedIds} mountains={mountainsData} />
        </div>
        <div className="space-y-8">
          {regionOrder.map((region) => {
            const mountains = groupedMountains[region];
            if (!mountains || mountains.length === 0) return null;
            return (
              <div key={region} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-indigo-200 pb-2">{region}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {mountains.map((mountain) => (
                    <button key={mountain.id} className={`mountain-card p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${completedIds.includes(mountain.id) ? 'mountain-completed' : 'mountain-not-completed'}`} style={{backgroundColor: completedIds.includes(mountain.id) ? '#f0fdf4' : 'white',border: completedIds.includes(mountain.id) ? '2px solid #bbf7d0' : '2px solid transparent',transition: 'all 0.2s ease'}} onClick={() => toggleMountain(mountain.id)} onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();toggleMountain(mountain.id);}}} aria-pressed={completedIds.includes(mountain.id)} aria-label={`${mountain.name_en} - ${completedIds.includes(mountain.id) ? 'Completed' : 'Not completed'}`} role="button" tabIndex={0}>
                      <MountainName nameJa={mountain.name_en} done={completedIds.includes(mountain.id)} />
                      <div className="text-sm text-gray-600 mt-1">{mountain.name_en}</div>
                      <div className="text-xs text-gray-500">{mountain.prefecture} • {mountain.elevation_m}m</div>
                      <div className="text-xs text-gray-500 mt-1">{mountain.difficulty}</div>
                      {completedIds.includes(mountain.id) && (
                        <MountainDateDisplay mountainId={mountain.id} mountainName={mountain.name_en} hikedOn={getCompletionData(mountain.id)?.hiked_on || null} onDateChange={(date) => setCompletionDate(mountain.id, date)} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center text-gray-600">
          {user ? (
            <p>Click a mountain to mark as completed. You can update the date after marking it.</p>
          ) : (
            <p>Sign up to start tracking your mountain climbing journey and share your progress with others.</p>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
