-- Quick migration script (minimal version)
-- Use this if you want a fast migration without backup/safety features

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

-- Convert existing numeric values to strings
UPDATE public.template_exercises
SET
  sets = sets::text,
  reps = reps::text,
  rest_sec = rest_sec::text;

UPDATE public.performed_sets
SET
  planned_reps = planned_reps::text,
  reps = reps::text;

-- Show results
SELECT 'Migration completed successfully!' as status;
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('template_exercises', 'performed_sets')
  AND column_name IN ('sets', 'reps', 'rest_sec', 'load', 'planned_reps')
ORDER BY table_name, column_name;
