import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ja', 'zh'],

  // Used when no locale matches
  defaultLocale: 'en'
});

export const config = {
  // Match only internationalized pathnames, exclude /u/ routes
  matcher: ['/', '/(ja|en|zh)/:path*', '/((?!api|_next|_vercel|u|.*\\..*).*)']
};
