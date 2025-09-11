-- Migration: Add hiked_on date to user_mountains table
-- Date: 2025-01-11
-- Description: Allow users to optionally record the date they hiked each mountain

-- Add hiked_on column to user_mountains table
ALTER TABLE public.user_mountains
  ADD COLUMN IF NOT EXISTS hiked_on DATE NULL;

-- Optional: backfill existing completions with completed_at date
-- This gives existing completions a default date
UPDATE public.user_mountains 
SET hiked_on = COALESCE(hiked_on, completed_at::DATE)
WHERE hiked_on IS NULL;

-- RLS: Allow users to update their own hiked_on dates
CREATE POLICY IF NOT EXISTS "update-own-hiked-on"
ON public.user_mountains
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for profile/timeline queries
CREATE INDEX IF NOT EXISTS idx_user_mountains_user_hiked_on
ON public.user_mountains (user_id, hiked_on);

-- Add comment for documentation
COMMENT ON COLUMN public.user_mountains.hiked_on IS 'Optional date when the user actually hiked the mountain (YYYY-MM-DD format)';
