-- Add role column to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN role TEXT DEFAULT 'user';

-- Set admin role for the specific user
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'alexgomes.production@gmail.com';

-- Add RLS policy for role checking
CREATE POLICY "Users can view profiles for role checking" 
ON public.profiles 
FOR SELECT 
USING (true);