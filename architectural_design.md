Architectural Design for Japan’s 100 Famous Mountains Web System
This document defines the architecture for a multilingual web application that enables hikers to track and share their progress climbing Japan’s 100 Famous Mountains (日本百名山). The design emphasizes simplicity in early versions while providing a foundation for expansion.

Goals
	•	v0 (MVP)
	◦	Display all 100 mountains in Kanji.
	◦	Grey = not climbed, black = climbed.
	◦	Progress counter at the top (X/100).
	•	v1
	◦	Allow users to generate a shareable image.
	◦	Image includes username, completed count, and a QR code linking to their public profile.
	•	v2
	◦	Introduce user accounts and persistent data storage.
	◦	Users manually mark climbed mountains (no YAMAP integration).
	◦	Public profile pages available at slug-based URLs.

Target Users
	•	Hiking enthusiasts who want to track progress toward climbing all 100 Famous Mountains.

Key Features
	•	Multilingual: Japanese, English, and Chinese.
	•	Minimalist design: Easy to share on SNS.
	•	Secure sharing: Public profiles available under clean slugs (e.g., /u/simona-d), not UUIDs.

Tech Stack
	•	Frontend: Next.js (App Router, React Server Components).
	•	Backend: Supabase (Postgres, Auth, Row-Level Security, Edge Functions).
	•	Styling: Tailwind CSS.
	•	i18n: next-intl for multilingual routing and translations.

File & Folder Structure

/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (main)/
│   │   │   ├── dashboard/page.tsx   # v0: checklist + progress
│   │   │   ├── profile/page.tsx     # v2: user profile & settings
│   │   │   └── share/page.tsx       # v1: share preview
│   │   └── layout.tsx
│   ├── api/
│   │   └── og/route.tsx             # v1: OG image generation
│   └── middleware.ts                # locale detection, auth
├── components/
│   ├── ui/                          # Reusable UI elements
│   ├── dashboard/
│   │   ├── ProgressCounter.tsx
│   │   └── MountainName.tsx         # Kanji badge component
│   └── share/
│       └── ShareImageGenerator.tsx  # v1: PNG export
├── lib/
│   ├── supabase/{client.ts,server.ts}
│   ├── i18n/{ja.json,en.json,zh.json}
│   ├── utils/
│   │   ├── qrCodeUtils.ts
│   │   └── imageUtils.ts
│   └── data/mountains.json          # static seed for 100 peaks
├── styles/
│   ├── globals.css
│   └── tailwind.config.ts
├── db/
│   ├── schema.sql                   # Supabase schema
│   └── seed_mountains.sql           # mountain data seed
└── next.config.mjs

Data Model
users
Stores account-level information.
Field
Type
Notes
id
UUID (PK)
Supabase auth.uid(), internal only
username
TEXT
User’s chosen display name
slug
TEXT (unique)
Public identifier for profile (/u/{slug}), immutable
locale
TEXT
Preferred language
created_at
TIMESTAMP


mountains
Metadata for Japan’s 100 Famous Mountains (seeded once).
Field
Type
Notes
id
TEXT (PK)
e.g. mt_fuji
name_ja
TEXT
Kanji name
name_en
TEXT
English name
name_zh
TEXT
Chinese name
region
TEXT
北海道・東北, 関東, 中部, etc.
prefecture
TEXT

elevation_m
INT

created_at
TIMESTAMP


user_mountains
Tracks which mountains a user has marked as climbed.
Field
Type
Notes
user_id
UUID (FK → users.id)

mountain_id
TEXT (FK → mountains.id)

completed_at
TIMESTAMP
Defaults to now
source
ENUM
For now always 'manual'
Composite PK: (user_id, mountain_id)

Security & RLS
	•	users
	◦	Each user can read/update only their own row.
	◦	Public profile queries by slug only expose username, slug, and progress stats.
	•	user_mountains
	◦	RLS enforces ownership:CREATE POLICY "Users manage their own check-ins"
	◦	ON user_mountains
	◦	USING (auth.uid() = user_id)
	◦	WITH CHECK (auth.uid() = user_id);
	◦	
	•	mountains
	◦	World-readable, no RLS required.

Component Roles
	•	MountainName.tsx
	◦	Renders Kanji badge.
	◦	Grey text if not completed, black if completed.
	•	ProgressCounter.tsx
	◦	Displays X/100 completion status.
	•	ShareImageGenerator.tsx (v1)
	◦	Generates downloadable PNG with username, progress, and QR code.

Interaction Flows
v0 — Checklist
	1	User visits dashboard.
	2	Sees all 100 mountains in Kanji.
	3	Clicks to toggle completion (grey → black).
	4	Progress counter updates.
v1 — Sharing
	1	User navigates to share page.
	2	ShareImageGenerator fetches username + progress.
	3	QR code encodes profile URL (/u/{slug}).
	4	User downloads PNG or shares link with OG preview.
v2 — Accounts
	1	User signs up or logs in.
	2	Their progress is saved in user_mountains.
	3	Public profile is accessible at /u/{slug}.
	4	Visitors see safe, read-only data (no UID/email exposure).

i18n
	•	Locale routing: /[locale]/… with middleware.ts for detection.
	•	Translation files: /lib/i18n/{ja,en,zh}.json.
	•	All UI text uses next-intl message catalogs.

Privacy & Sharing
	•	Public QR codes and links use slugs, never Supabase UUIDs or emails.
	•	Example:https://100mountains.example.com/u/simona-d
	•	
	•	Even if username changes, the slug remains immutable to preserve links.

Future Considerations
	•	Add filtering by region, difficulty, elevation.
	•	Improve shareability with server-generated OG images.
	•	Support offline/PWA for hikers.
	•	Introduce illustrations or icons once licensed assets are available.
