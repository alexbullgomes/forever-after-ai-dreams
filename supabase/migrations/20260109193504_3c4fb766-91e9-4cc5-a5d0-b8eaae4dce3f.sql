-- =====================================================
-- Fix 1: Visitors table UPDATE policy (CRITICAL)
-- Current policy "Public can update own visitor record by visitor_id" uses USING(true)
-- which allows ANY anonymous user to UPDATE ANY visitor record
-- =====================================================

-- Drop the dangerous public UPDATE policy
DROP POLICY IF EXISTS "Public can update own visitor record by visitor_id" ON visitors;

-- Create a secure policy: authenticated users can only update their linked visitor
CREATE POLICY "Authenticated users can update own linked visitor" ON visitors
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  linked_user_id = auth.uid()
);

-- Admin policy already exists: "Admins can update all visitors"

-- =====================================================
-- Fix 2: visitor_popup_submissions - Tighten SELECT policy
-- Current policy allows access if visitor_id matches IN subquery from profiles
-- Harden with explicit auth check and LIMIT 1 for performance
-- =====================================================

-- Drop existing user SELECT policy
DROP POLICY IF EXISTS "Users can view their own submissions" ON visitor_popup_submissions;

-- Create stricter policy with explicit auth check
CREATE POLICY "Users can view only their linked submissions" ON visitor_popup_submissions
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    visitor_id = (SELECT visitor_id FROM profiles WHERE id = auth.uid() LIMIT 1)
    OR user_id = auth.uid()
  )
);

-- Admin policy already exists: "Admins can view all submissions"