-- Fix visitor_popup_submissions phone leak by preventing visitor_id updates on profiles
-- This prevents attackers from changing their visitor_id to match another user's

-- Drop and recreate the user update policy to prevent visitor_id changes
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

-- Create new policy that prevents users from changing their visitor_id
CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Allow if visitor_id is not being changed (NULL to NULL, or same value, or NULL to new value for linking)
      visitor_id IS NOT DISTINCT FROM (SELECT visitor_id FROM public.profiles WHERE id = auth.uid())
      OR
      -- Allow if current visitor_id is NULL (first time linking)
      (SELECT visitor_id FROM public.profiles WHERE id = auth.uid()) IS NULL
    )
  );

-- Also update the visitor_popup_submissions SELECT policy to be more restrictive
-- Remove the visitor_id path entirely and only allow access via user_id after sync
DROP POLICY IF EXISTS "Users can view only their linked submissions" ON public.visitor_popup_submissions;

CREATE POLICY "Users can view only their synced submissions" ON public.visitor_popup_submissions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );