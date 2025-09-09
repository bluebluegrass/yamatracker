MVP Build Plan — Japan 100 Mountains
Phase 1 — Project Setup

Initialize Next.js App

Create new Next.js App Router project with TypeScript + Tailwind.

Verify npm run dev starts successfully.

Add Global Styles

Create styles/globals.css.

Confirm Tailwind utility classes render correctly.

Add i18n Framework

Install and configure next-intl.

Create minimal translation files (ja.json, en.json, zh.json) with one string.

Test locale switching works.

Phase 2 — Static Mountain List

Seed Mountain Data (JSON)

Create lib/data/mountains.json with at least 3 sample mountains (id, Kanji, region).

Test file loads in a page.

Create MountainName Component

Accepts props: { nameJa, done }.

Renders Kanji in grey if done=false, black if done=true.

Test by rendering two examples side by side.

Create Dashboard Page

Import mountains.json.

Render all mountain names with MountainName.

Test: page shows Kanji list.

Add ProgressCounter Component

Accepts props: { completedCount }.

Displays text X/100.

Test: with 2 completed, shows 2/100.

Wire Progress Counter to State

Add local React state completedIds: string[].

Count length for ProgressCounter.

Test: clicking toggle updates both the name style and counter.

Phase 3 — State Persistence (Supabase)

Setup Supabase Client

Add lib/supabase/client.ts with connection code.

Test: can connect anonymously.

Create Database Schema

Create tables: users, mountains, user_mountains.

Seed mountains with sample rows.

Test: SELECT * FROM mountains works.

Configure RLS Policies

Add Row-Level Security for user_mountains.

Test: anonymous cannot write; logged-in user can write their own rows.

Integrate Supabase Auth

Add login/signup pages.

Test: user can sign up, session token stored.

Fetch Completed from DB

Dashboard loads user’s completed mountain IDs from user_mountains.

Test: toggling persists to DB, refresh page keeps state.

Phase 4 — Sharing (v1)

Add Slug Field to Users

Generate slug at signup.

Test: /u/{slug} route resolves to profile.

Create Public Profile Page

Query user by slug.

Render username + completed count.

Test: visiting /u/{slug} works without auth.

Add QR Code Utility

Generate QR code from profile URL.

Test: QR scans to correct /u/{slug}.

Add Share Image Generator

Render username + progress + QR into canvas.

Export as PNG.

Test: clicking “Download” produces correct PNG.

Add OG Image Endpoint

Create app/api/og/route.tsx using Satori/Resvg.

Test: visiting /api/og?slug=xxx returns image.

Phase 5 — Polish & Hardening

Add Region Grouping

Group mountains by region in dashboard.

Test: sections titled 北海道・東北, 関東, etc.

Add Language Switcher

Header with JA / EN / 中文.

Test: switches translation files.

Accessibility Review

Ensure buttons are keyboard-focusable.

Add aria-pressed to mountain toggles.

Test with keyboard-only navigation.

Add Basic Error Handling

Show toast if Supabase write fails.

Test: simulate network error → toast appears.

Deploy to Vercel

Connect Supabase + environment variables.

Test: signup/login, check-in, share link all work on production domain.

✅ At the end of this plan, you’ll have:

Kanji-based checklist with persistent user accounts.

Progress counter.

Public profile pages via slugs.

Shareable images + QR codes.

Secure RLS policies.