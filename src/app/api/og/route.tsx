import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug parameter', { status: 400 });
    }

    // Fetch user data
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('username, slug, id')
      .eq('slug', slug)
      .single();

    if (error || !user) {
      return new Response('User not found', { status: 404 });
    }

    // Fetch completed mountains count
    const { data: completions, error: completionsError } = await supabaseAdmin
      .from('user_mountains')
      .select('mountain_id')
      .eq('user_id', user.id);

    const completedCount = completions?.length || 0;
    const progress = Math.round((completedCount / 100) * 100);

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            backgroundImage: 'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
          {/* Main container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '60px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '2px solid #e5e7eb',
              maxWidth: '800px',
              margin: '40px',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#1f2937',
                textAlign: 'center',
                marginBottom: '20px',
                lineHeight: '1.2',
              }}
            >
              {user.username}'s Mountain Journey
            </div>

            {/* Progress */}
            <div
              style={{
                fontSize: '32px',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '30px',
              }}
            >
              {completedCount}/100 Mountains Completed
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '400px',
                height: '24px',
                backgroundColor: '#e5e7eb',
                borderRadius: '12px',
                marginBottom: '30px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  borderRadius: '12px',
                }}
              />
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '40px',
                marginBottom: '30px',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#3b82f6',
                  }}
                >
                  {progress}%
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    color: '#6b7280',
                  }}
                >
                  Progress
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#10b981',
                  }}
                >
                  {completedCount}
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    color: '#6b7280',
                  }}
                >
                  Completed
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                  }}
                >
                  {100 - completedCount}
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    color: '#6b7280',
                  }}
                >
                  Remaining
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                fontSize: '20px',
                color: '#6b7280',
                textAlign: 'center',
              }}
            >
              Japan's 100 Famous Mountains Tracker
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
