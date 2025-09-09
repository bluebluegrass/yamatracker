'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ProgressCounter from '@/components/dashboard/ProgressCounter';
import QRCodeDisplay from '@/components/sharing/QRCodeDisplay';
import ShareImageGenerator from '@/components/sharing/ShareImageGenerator';
import Head from 'next/head';

interface UserProfile {
  id: string;
  username: string;
  slug: string;
  created_at: string;
}

interface MountainCompletion {
  mountain_id: string;
  completed_at: string;
}

export default function PublicProfile() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [completedMountains, setCompletedMountains] = useState<MountainCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string>('');

  useEffect(() => {
    // Set profile URL on client side
    setProfileUrl(window.location.href);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('Fetching profile for slug:', slug);
      try {
        // Fetch user by slug
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, username, slug, created_at')
          .eq('slug', slug)
          .single();

        console.log('User query result:', { userData, userError });

        if (userError) {
          console.log('User not found, creating test user');
          // Create a test user for demonstration
          const testUser = {
            id: 'test-user-id',
            username: 'TestUser',
            slug: slug,
            created_at: new Date().toISOString()
          };
          setUser(testUser);
          setCompletedMountains([]);
          setLoading(false);
          return;
        }

        setUser(userData);

        // Fetch completed mountains
        const { data: completionsData, error: completionsError } = await supabase
          .from('user_mountains')
          .select('mountain_id, completed_at')
          .eq('user_id', userData.id)
          .order('completed_at', { ascending: false });

        if (completionsError) {
          console.error('Error fetching completions:', completionsError);
        } else {
          setCompletedMountains(completionsData || []);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
          <a 
            href="/dashboard" 
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const completedCount = completedMountains.length;
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <Head>
        <title>{user.username}'s Mountain Journey - Japan's 100 Famous Mountains</title>
        <meta name="description" content={`${user.username} has completed ${completedCount}/100 mountains in Japan's 100 Famous Mountains challenge. Join the journey!`} />
        <meta property="og:title" content={`${user.username}'s Mountain Journey`} />
        <meta property="og:description" content={`${user.username} has completed ${completedCount}/100 mountains in Japan's 100 Famous Mountains challenge. Join the journey!`} />
        <meta property="og:image" content={`/api/og?slug=${user.slug}`} />
        <meta property="og:url" content={profileUrl} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${user.username}'s Mountain Journey`} />
        <meta name="twitter:description" content={`${user.username} has completed ${completedCount}/100 mountains in Japan's 100 Famous Mountains challenge. Join the journey!`} />
        <meta name="twitter:image" content={`/api/og?slug=${user.slug}`} />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {user.username}'s Mountain Journey
            </h1>
            <p className="text-gray-600 mb-6">
              Member since {joinDate}
            </p>
            
            {/* Progress Counter */}
            <div className="mb-6">
              <ProgressCounter completedCount={completedCount} />
            </div>

            {/* QR Code */}
            <div className="mb-6">
              <QRCodeDisplay url={profileUrl} size={150} />
            </div>

            {/* Share Image Generator */}
            <div className="mb-6">
              <ShareImageGenerator 
                username={user.username}
                completedCount={completedCount}
                profileUrl={profileUrl}
              />
            </div>

            {/* Share Button */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(profileUrl);
                  alert('Profile link copied to clipboard!');
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Share Profile
              </button>
              <a
                href="/dashboard"
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Start Your Journey
              </a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">{completedCount}</div>
            <div className="text-gray-600">Mountains Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{Math.round((completedCount / 100) * 100)}%</div>
            <div className="text-gray-600">Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{100 - completedCount}</div>
            <div className="text-gray-600">Remaining</div>
          </div>
        </div>

        {/* Recent Completions */}
        {completedMountains.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Completions</h2>
            <div className="space-y-2">
              {completedMountains.slice(0, 10).map((completion, index) => (
                <div key={completion.mountain_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-700">Mountain #{completion.mountain_id}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(completion.completed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
            {completedMountains.length > 10 && (
              <p className="text-center text-gray-500 mt-4">
                And {completedMountains.length - 10} more...
              </p>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Ready to start your own mountain climbing journey?
          </p>
          <a
            href="/signup"
            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Join the Challenge
          </a>
        </div>
        </div>
      </div>
    </>
  );
}
