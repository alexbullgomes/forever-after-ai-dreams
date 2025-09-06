-- Add pipeline columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN pipeline_profile text DEFAULT 'Disable',
ADD COLUMN pipeline_status text DEFAULT 'New Lead & Negotiation';

-- Add check constraint for pipeline_profile
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_pipeline_profile_check 
CHECK (pipeline_profile IN ('Enable', 'Disable'));

-- Add check constraint for pipeline_status
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_pipeline_status_check 
CHECK (pipeline_status IN (
  'New Lead & Negotiation',
  'Closed Deal & Pre-Production', 
  'Production',
  'Post-Production (Editing)',
  'Delivery & Finalization'
));