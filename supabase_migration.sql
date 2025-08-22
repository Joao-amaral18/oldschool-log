-- Supabase Migration: Add range support to workout columns
-- This script can be run via Supabase Dashboard SQL Editor or CLI

-- Update template_exercises table
ALTER TABLE public.template_exercises
  ALTER COLUMN sets TYPE varchar(50),
  ALTER COLUMN reps TYPE varchar(50),
  ALTER COLUMN rest_sec TYPE varchar(50),
  ALTER COLUMN load DROP NOT NULL,
  ALTER COLUMN load SET DEFAULT 0;

-- Set default value for rest_sec separately
ALTER TABLE public.template_exercises
  ALTER COLUMN rest_sec SET DEFAULT '60';

-- Update performed_sets table
ALTER TABLE public.performed_sets
  ALTER COLUMN planned_reps TYPE varchar(50),
  ALTER COLUMN reps TYPE varchar(50),
  ALTER COLUMN load DROP NOT NULL;

-- Convert existing numeric values to strings for backward compatibility
UPDATE public.template_exercises
SET
  sets = CASE WHEN sets IS NOT NULL THEN sets::text ELSE NULL END,
  reps = CASE WHEN reps IS NOT NULL THEN reps::text ELSE NULL END,
  rest_sec = CASE WHEN rest_sec IS NOT NULL THEN rest_sec::text ELSE NULL END;

UPDATE public.performed_sets
SET
  planned_reps = CASE WHEN planned_reps IS NOT NULL THEN planned_reps::text ELSE NULL END,
  reps = CASE WHEN reps IS NOT NULL THEN reps::text ELSE NULL END;

-- Verify the changes
SELECT
  'Migration completed successfully! Here are the updated column types:' as status;

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('template_exercises', 'performed_sets')
  AND column_name IN ('sets', 'reps', 'rest_sec', 'load', 'planned_reps')
ORDER BY table_name, column_name;
