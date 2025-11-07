import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { FEATURE_TRACKER_V2 } from '@/lib/config/features';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

// Create the i18n middleware
const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(req: NextRequest) {
  // Handle i18n routing first
  const response = handleI18nRouting(req);

  // If i18n middleware returned a redirect, use it
  if (response.status === 307 || response.status === 302) {
    return response;
  }

  // Continue with Supabase auth if tracker v2 is enabled
  if (!FEATURE_TRACKER_V2) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: req.cookies }
  );
  // Optionally, you can check session or user here if needed
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
