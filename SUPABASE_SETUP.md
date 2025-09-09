# Supabase Configuration Guide

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## How to Get These Values

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to Settings > API
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema

The following tables need to be created in your Supabase project:

### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  username TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### mountains table
```sql
CREATE TABLE mountains (
  id TEXT PRIMARY KEY,
  name_ja TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  region TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  elevation_m INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### user_mountains table
```sql
CREATE TABLE user_mountains (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mountain_id TEXT REFERENCES mountains(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'manual',
  PRIMARY KEY (user_id, mountain_id)
);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mountains ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mountains ENABLE ROW LEVEL SECURITY;

-- Users can read/update only their own row
CREATE POLICY "Users manage their own profile" ON users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Mountains are world-readable
CREATE POLICY "Mountains are publicly readable" ON mountains
  FOR SELECT USING (true);

-- Users can manage their own mountain completions
CREATE POLICY "Users manage their own check-ins" ON user_mountains
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```



