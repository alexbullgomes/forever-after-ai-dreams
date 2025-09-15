-- Remove the overly permissive policy that allows any user to read all profiles
DROP POLICY IF EXISTS "Users can view profiles for role checking" ON public.profiles;

-- Create a more secure role checking function that doesn't expose profile data
CREATE OR REPLACE FUNCTION public.check_user_role_only(_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- Update the has_role function to use the secure role checking function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.check_user_role_only(_user_id) = _role;
$$;

-- Create a minimal policy that only allows reading role information for the current user
CREATE POLICY "Users can check their own role only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id AND current_setting('request.jwt.claims', true)::jsonb->>'sub' IS NOT NULL);

-- Ensure admins can still view all profiles (this policy already exists but making sure)
-- This is already covered by the existing "Admins can view all profiles" policy