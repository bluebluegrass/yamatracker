import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { FEATURE_TRACKER_V2 } from '@/lib/config/features';

export async function middleware(req: NextRequest) {
  if (!FEATURE_TRACKER_V2) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  await supabase.auth.getSession();
  return res;
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
