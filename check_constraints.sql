-- Check for constraints that might conflict with varchar conversion

-- Check existing constraints on template_exercises
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.template_exercises'::regclass
  AND conname LIKE '%check%';

-- Check existing constraints on performed_sets
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.performed_sets'::regclass
  AND conname LIKE '%check%';

-- Show all constraints for reference
SELECT
  schemaname,
  tablename,
  constraintname,
  constraintdef
FROM pg_constraints
WHERE schemaname = 'public'
  AND tablename IN ('template_exercises', 'performed_sets')
ORDER BY tablename, constraintname;
