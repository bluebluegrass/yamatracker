-- Database Schema for Japan's 100 Famous Mountains Tracker
-- Run this SQL in your Supabase SQL Editor

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  username TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mountains table
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

-- Create user_mountains table (junction table for user completions)
CREATE TABLE user_mountains (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mountain_id TEXT REFERENCES mountains(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'manual',
  PRIMARY KEY (user_id, mountain_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mountains ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mountains ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read/update only their own row
CREATE POLICY "Users manage their own profile" ON users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Mountains are world-readable (no RLS needed, but keeping for consistency)
CREATE POLICY "Mountains are publicly readable" ON mountains
  FOR SELECT USING (true);

-- Users can manage their own mountain completions
CREATE POLICY "Users manage their own check-ins" ON user_mountains
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_mountains_user_id ON user_mountains(user_id);
CREATE INDEX idx_user_mountains_mountain_id ON user_mountains(mountain_id);
CREATE INDEX idx_mountains_region ON mountains(region);



