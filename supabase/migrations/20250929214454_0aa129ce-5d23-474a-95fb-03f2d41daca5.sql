-- Add user_dashboard column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_dashboard BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.user_dashboard IS 'Controls whether user has access to their personalized User Dashboard';