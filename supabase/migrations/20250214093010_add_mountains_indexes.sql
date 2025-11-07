-- Migration: Ensure mountains columns and performance indexes
-- Description: Verifies required columns exist, enforces composite key, and adds helper indexes.

DO $$
BEGIN
  -- Guard: verify mountains columns required for tracker v2 are present
  PERFORM 1 FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'mountains'
     AND column_name = 'id';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column % missing on %.%','id','public','mountains';
  END IF;

  PERFORM 1 FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'mountains'
     AND column_name = 'name_ja';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column % missing on %.%','name_ja','public','mountains';
  END IF;

  PERFORM 1 FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'mountains'
     AND column_name = 'name_en';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column % missing on %.%','name_en','public','mountains';
  END IF;

  PERFORM 1 FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'mountains'
     AND column_name = 'name_zh';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column % missing on %.%','name_zh','public','mountains';
  END IF;

  PERFORM 1 FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'mountains'
     AND column_name = 'region';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column % missing on %.%','region','public','mountains';
  END IF;

  PERFORM 1 FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'mountains'
     AND column_name = 'prefecture';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column % missing on %.%','prefecture','public','mountains';
  END IF;

  PERFORM 1 FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'mountains'
     AND column_name = 'elevation_m';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column % missing on %.%','elevation_m','public','mountains';
  END IF;

  PERFORM 1 FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'mountains'
     AND column_name = 'difficulty';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Column % missing on %.%','difficulty','public','mountains';
  END IF;
END $$;

-- Ensure composite primary/unique constraint exists on user completions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_mountains'::regclass
      AND contype IN ('p','u')
      AND pg_get_constraintdef(oid) LIKE '%(user_id, mountain_id)'
  ) THEN
    ALTER TABLE public.user_mountains
      ADD CONSTRAINT user_mountains_pkey
      PRIMARY KEY (user_id, mountain_id);
  END IF;
END $$;

-- Supporting indexes for query performance
CREATE INDEX IF NOT EXISTS idx_mountains_region ON public.mountains (region);
CREATE INDEX IF NOT EXISTS idx_mountains_difficulty ON public.mountains (difficulty);
CREATE INDEX IF NOT EXISTS idx_mountains_elevation_m ON public.mountains (elevation_m);
