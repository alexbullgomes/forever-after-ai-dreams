-- 1. Change default for future users
ALTER TABLE public.profiles
ALTER COLUMN pipeline_profile SET DEFAULT 'Enable';

-- 2. Backfill existing hidden users
UPDATE public.profiles
SET pipeline_profile = 'Enable'
WHERE pipeline_profile = 'Disable';