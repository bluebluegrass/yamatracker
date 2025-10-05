import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSnapshot } from '@/lib/supabase/api';
import { handleApiError } from '@/lib/utils/apiError';

export async function GET(request: NextRequest) {
  try {
    // ...existing code...
    const snapshot = await getSnapshot(supabaseAdmin);
    return NextResponse.json({
      success: true,
      snapshot,
      debug: {
        timestamp: new Date().toISOString(),
        total: snapshot.total,
        completed: snapshot.completed,
        regionsCount: snapshot.by_region.length,
        difficultiesCount: snapshot.by_difficulty.length,
        badgesCount: snapshot.badges.length
      }
    });
  } catch (error) {
    return handleApiError(error, 500);
  }
}
