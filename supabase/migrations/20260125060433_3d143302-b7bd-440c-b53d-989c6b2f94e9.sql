-- Fix 1: Restrict booking_slot_holds SELECT to only user's own holds (by visitor_id or user_id)
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view active booking slot holds" ON public.booking_slot_holds;

-- Create a new policy that restricts SELECT to the user's own holds
CREATE POLICY "Users can view their own booking slot holds"
ON public.booking_slot_holds
FOR SELECT
USING (
  -- Admin can see all
  has_role(auth.uid(), 'admin'::text)
  OR
  -- Authenticated users can see their own holds
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR
  -- Visitors can see holds matching their visitor_id (requires knowing visitor_id)
  -- This is checked at the edge function level since anon users can't access RLS directly
  false
);

-- Fix 2: Strengthen visitor_popup_submissions - ensure proper owner-scoped access
-- The existing policy "Users can view only their synced submissions" with (auth.uid() = user_id) is good
-- The "Deny unauthenticated access to submissions" with USING(false) blocks anon SELECT
-- Verified: Current policies are secure. No changes needed.

-- Fix 3: Add rate limiting helper function for booking slot holds
-- This function can be called from edge functions to check rate limits
CREATE OR REPLACE FUNCTION public.check_booking_hold_rate_limit(p_visitor_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_rate_limit INTEGER := 5; -- Max 5 holds per hour per visitor/user
  v_window INTERVAL := '1 hour';
BEGIN
  -- Count active holds created in the last hour for this visitor/user
  SELECT COUNT(*) INTO v_count
  FROM booking_slot_holds
  WHERE 
    created_at > now() - v_window
    AND status = 'active'
    AND (
      (p_visitor_id IS NOT NULL AND visitor_id = p_visitor_id)
      OR (p_user_id IS NOT NULL AND user_id = p_user_id)
    );
  
  -- Return TRUE if under rate limit, FALSE if exceeded
  RETURN v_count < v_rate_limit;
END;
$$;

-- Fix 4: Add rate limiting helper function for popup submissions
CREATE OR REPLACE FUNCTION public.check_popup_submission_rate_limit(p_visitor_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_rate_limit INTEGER := 3; -- Max 3 submissions per hour per visitor
  v_window INTERVAL := '1 hour';
BEGIN
  -- Count submissions created in the last hour for this visitor
  SELECT COUNT(*) INTO v_count
  FROM visitor_popup_submissions
  WHERE 
    submitted_at > now() - v_window
    AND visitor_id = p_visitor_id;
  
  -- Return TRUE if under rate limit, FALSE if exceeded
  RETURN v_count < v_rate_limit;
END;
$$;