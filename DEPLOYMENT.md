# Deployment Guide for Hyakumeizan Tracker

## Prerequisites
- Vercel account
- Supabase project with database schema deployed
- GitHub repository (optional, for automatic deployments)

## Step 1: Prepare Supabase
1. Ensure your Supabase project has the database schema from `db/schema.sql`
2. Seed the mountains data using `db/seed_mountains.sql`
3. Note your project URL and API keys from Supabase dashboard

## Step 2: Deploy to Vercel
1. Connect your GitHub repository to Vercel (or use Vercel CLI)
2. Set the following environment variables in Vercel project settings:

### Required Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Optional Environment Variables:
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_key
VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

## Step 3: Configure Build Settings
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## Step 4: Test Production Deployment
1. Visit your deployed URL
2. Test signup/login functionality
3. Test mountain check-in persistence
4. Test profile sharing and QR code generation
5. Test language switching
6. Test error handling (try with network disabled)

## Step 5: Domain Configuration (Optional)
1. Add custom domain in Vercel dashboard
2. Update `NEXTAUTH_URL` environment variable
3. Configure DNS records as instructed by Vercel

## Troubleshooting
- Check Vercel function logs for API route errors
- Verify Supabase RLS policies are correctly configured
- Ensure all environment variables are set correctly
- Check browser console for client-side errors

## Features Included in This Deployment:
✅ Region-grouped mountain dashboard
✅ Multi-language support (JA/EN/ZH)
✅ User authentication and profiles
✅ Mountain completion tracking
✅ Public profile pages with QR codes
✅ Shareable progress images
✅ Toast notifications for errors
✅ Keyboard accessibility
✅ Responsive design
