-- Fix RLS policy to allow user creation during signup
-- Run this in your Supabase SQL Editor

-- Drop the existing policy
DROP POLICY IF EXISTS "Users manage their own profile" ON users;

-- Create a new policy that allows INSERT during signup
CREATE POLICY "Users manage their own profile" ON users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add a separate policy for INSERT operations during signup
CREATE POLICY "Allow user creation during signup" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
