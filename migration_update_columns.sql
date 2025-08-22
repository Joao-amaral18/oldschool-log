-- Migration script to update existing columns to support varchar ranges
-- Run this on your existing database to update the schema

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

-- Optional: Convert existing numeric values to strings
-- This ensures backward compatibility by converting existing integer values to strings
UPDATE public.template_exercises
SET
  sets = sets::text,
  reps = reps::text,
  rest_sec = rest_sec::text
WHERE sets IS NOT NULL OR reps IS NOT NULL OR rest_sec IS NOT NULL;

UPDATE public.performed_sets
SET
  planned_reps = planned_reps::text,
  reps = reps::text
WHERE planned_reps IS NOT NULL OR reps IS NOT NULL;

-- Verify the changes
SELECT
  'template_exercises' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'template_exercises'
  AND column_name IN ('sets', 'reps', 'rest_sec', 'load')

UNION ALL

SELECT
  'performed_sets' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'performed_sets'
  AND column_name IN ('planned_reps', 'reps', 'load')
ORDER BY table_name, column_name;
