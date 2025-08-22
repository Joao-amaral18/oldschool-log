-- Drop constraints that conflict with varchar conversion

-- Check and drop constraints on template_exercises
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
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
END $$;

-- Check and drop constraints on performed_sets
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
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

-- Show remaining constraints
SELECT 'Remaining constraints after cleanup:' as info;
SELECT
  schemaname,
  tablename,
  constraintname,
  constraintdef
FROM pg_constraints
WHERE schemaname = 'public'
  AND tablename IN ('template_exercises', 'performed_sets')
ORDER BY tablename, constraintname;
