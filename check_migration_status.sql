-- Check current database schema status
-- Run this to see what columns need to be updated

-- Check template_exercises table structure
SELECT
  'template_exercises' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE
    WHEN column_name = 'sets' AND data_type != 'character varying' THEN 'NEEDS UPDATE: should be varchar(50)'
    WHEN column_name = 'reps' AND data_type != 'character varying' THEN 'NEEDS UPDATE: should be varchar(50)'
    WHEN column_name = 'rest_sec' AND data_type != 'character varying' THEN 'NEEDS UPDATE: should be varchar(50)'
    WHEN column_name = 'load' AND is_nullable = 'NO' THEN 'NEEDS UPDATE: should be nullable'
    ELSE 'OK'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'template_exercises'
  AND column_name IN ('sets', 'reps', 'rest_sec', 'load')

UNION ALL

-- Check performed_sets table structure
SELECT
  'performed_sets' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE
    WHEN column_name IN ('planned_reps', 'reps') AND data_type != 'character varying' THEN 'NEEDS UPDATE: should be varchar(50)'
    WHEN column_name = 'load' AND is_nullable = 'NO' THEN 'NEEDS UPDATE: should be nullable'
    ELSE 'OK'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'performed_sets'
  AND column_name IN ('planned_reps', 'reps', 'load')

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
