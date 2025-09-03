-- Add new columns to profiles table for admin management
ALTER TABLE public.profiles 
ADD COLUMN briefing text,
ADD COLUMN status text DEFAULT 'New Lead';

-- Create index for better performance on status queries
CREATE INDEX idx_profiles_status ON public.profiles(status);

-- Update RLS policies to ensure admins can fully manage profiles
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));