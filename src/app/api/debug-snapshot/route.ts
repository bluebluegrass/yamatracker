import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSnapshot } from '@/lib/supabase/api';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Fetching dashboard snapshot...');
    
    // Get the snapshot using our new API function
    const snapshot = await getSnapshot(supabaseAdmin);
    
    console.log('Debug: Snapshot fetched successfully:', {
      total: snapshot.total,
      completed: snapshot.completed,
      regionsCount: snapshot.by_region.length,
      difficultiesCount: snapshot.by_difficulty.length,
      badgesCount: snapshot.badges.length
    });
    
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
    console.error('Debug: Error fetching snapshot:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        timestamp: new Date().toISOString(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    }, { status: 500 });
  }
}
