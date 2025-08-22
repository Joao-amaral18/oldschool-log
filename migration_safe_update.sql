-- Safe migration script with rollback capability
-- This script includes safety checks and can be rolled back if needed

-- Start a transaction
BEGIN;

-- Create a backup of current data (optional but recommended)
CREATE TABLE IF NOT EXISTS template_exercises_backup AS
  SELECT * FROM public.template_exercises;

CREATE TABLE IF NOT EXISTS performed_sets_backup AS
  SELECT * FROM public.performed_sets;

-- Function to rollback changes (run this if you need to revert)
-- ROLLBACK;
-- DROP TABLE IF EXISTS template_exercises_backup;
-- DROP TABLE IF EXISTS performed_sets_backup;

-- Show current state before changes
SELECT
  'Before migration - template_exercises' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'template_exercises'
  AND column_name IN ('sets', 'reps', 'rest_sec', 'load');

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

-- Show state after changes
SELECT
  'After migration - template_exercises' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'template_exercises'
  AND column_name IN ('sets', 'reps', 'rest_sec', 'load');

SELECT
  'After migration - performed_sets' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'performed_sets'
  AND column_name IN ('planned_reps', 'reps', 'load');

-- Show sample data to verify conversion
SELECT
  'Sample template_exercises data' as info,
  id,
  sets,
  reps,
  rest_sec,
  load
FROM public.template_exercises
LIMIT 5;

SELECT
  'Sample performed_sets data' as info,
  id,
  planned_reps,
  reps,
  load
FROM public.performed_sets
LIMIT 5;

-- If everything looks good, commit the changes
COMMIT;

-- If you need to rollback (uncomment and run these lines):
-- ROLLBACK;
-- DROP TABLE IF EXISTS template_exercises_backup;
-- DROP TABLE IF EXISTS performed_sets_backup;

-- Clean up backup tables after confirming migration is successful
-- DROP TABLE IF EXISTS template_exercises_backup;
-- DROP TABLE IF EXISTS performed_sets_backup;
