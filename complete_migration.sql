-- Complete migration script with constraint handling
-- This script handles constraints that might conflict with varchar conversion

-- Step 1: Drop conflicting constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Dropping conflicting constraints...';

    -- Drop constraints on template_exercises
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.template_exercises'::regclass
          AND contype = 'c'  -- Check constraints
          AND (conname LIKE '%sets%' OR conname LIKE '%reps%' OR conname LIKE '%rest%')
    LOOP
        EXECUTE 'ALTER TABLE public.template_exercises DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;

    -- Drop constraints on performed_sets
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.performed_sets'::regclass
          AND contype = 'c'  -- Check constraints
          AND (conname LIKE '%reps%' OR conname LIKE '%load%')
    LOOP
        EXECUTE 'ALTER TABLE public.performed_sets DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Step 2: Convert columns to varchar
ALTER TABLE public.template_exercises
  ALTER COLUMN sets TYPE varchar(50);

ALTER TABLE public.template_exercises
  ALTER COLUMN reps TYPE varchar(50);

ALTER TABLE public.template_exercises
  ALTER COLUMN rest_sec TYPE varchar(50);

ALTER TABLE public.template_exercises
  ALTER COLUMN load DROP NOT NULL;

ALTER TABLE public.template_exercises
  ALTER COLUMN load SET DEFAULT 0;

ALTER TABLE public.template_exercises
  ALTER COLUMN rest_sec SET DEFAULT '60';

ALTER TABLE public.performed_sets
  ALTER COLUMN planned_reps TYPE varchar(50);

ALTER TABLE public.performed_sets
  ALTER COLUMN reps TYPE varchar(50);

ALTER TABLE public.performed_sets
  ALTER COLUMN load DROP NOT NULL;

-- Step 3: Convert existing numeric values to strings
UPDATE public.template_exercises
SET
  sets = CASE WHEN sets IS NOT NULL THEN sets::text ELSE NULL END,
  reps = CASE WHEN reps IS NOT NULL THEN reps::text ELSE NULL END,
  rest_sec = CASE WHEN rest_sec IS NOT NULL THEN rest_sec::text ELSE NULL END;

UPDATE public.performed_sets
SET
  planned_reps = CASE WHEN planned_reps IS NOT NULL THEN planned_reps::text ELSE NULL END,
  reps = CASE WHEN reps IS NOT NULL THEN reps::text ELSE NULL END;

-- Step 4: Optional - Recreate constraints for varchar validation
-- Uncomment these if you want to maintain some validation

-- ALTER TABLE public.template_exercises
--   ADD CONSTRAINT template_exercises_sets_check
--   CHECK (sets IS NULL OR sets ~ '^[0-9]+(-[0-9]+)?$');

-- ALTER TABLE public.template_exercises
--   ADD CONSTRAINT template_exercises_reps_check
--   CHECK (reps IS NULL OR reps ~ '^[0-9]+(-[0-9]+)?$');

-- ALTER TABLE public.template_exercises
--   ADD CONSTRAINT template_exercises_rest_sec_check
--   CHECK (rest_sec IS NULL OR rest_sec ~ '^[0-9]+(-[0-9]+)?$');

-- ALTER TABLE public.performed_sets
--   ADD CONSTRAINT performed_sets_reps_check
--   CHECK (reps IS NULL OR reps ~ '^[0-9]+$');

-- Step 5: Verify the changes
SELECT 'Migration completed successfully!' as status;

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

-- Show sample data
SELECT 'Sample template_exercises data:' as info;
SELECT id, sets, reps, rest_sec, load
FROM public.template_exercises
ORDER BY id
LIMIT 3;

SELECT 'Sample performed_sets data:' as info;
SELECT id, planned_reps, reps, load
FROM public.performed_sets
ORDER BY id
LIMIT 3;
