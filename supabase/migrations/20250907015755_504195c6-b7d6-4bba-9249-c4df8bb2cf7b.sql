-- Add sort_order column to profiles table for vertical ordering within pipeline columns
ALTER TABLE public.profiles 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for better performance when ordering
CREATE INDEX idx_profiles_pipeline_sort ON public.profiles(pipeline_status, sort_order);

-- Update existing profiles to have sequential sort_order values within each status
UPDATE public.profiles 
SET sort_order = subquery.row_number 
FROM (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY pipeline_status ORDER BY created_at) as row_number
  FROM public.profiles 
  WHERE pipeline_profile = 'Enable'
) AS subquery
WHERE public.profiles.id = subquery.id;