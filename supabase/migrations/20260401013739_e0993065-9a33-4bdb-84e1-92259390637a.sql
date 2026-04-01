-- Fix 1: n8n_chat_histories - Add RLS policies (RLS already enabled but no policies = deny all for anon/authenticated)
-- Add admin-only SELECT policy
CREATE POLICY "Admins can view chat histories"
  ON public.n8n_chat_histories
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::text));

-- Fix 2: referrals - Remove overly permissive public INSERT policy
DROP POLICY IF EXISTS "System can create referrals" ON public.referrals;

-- Add service-role-only INSERT policy
CREATE POLICY "Service role can create referrals"
  ON public.referrals
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Fix 3: booking_requests - Remove the unsafe OR (user_id IS NULL) from update policy
DROP POLICY IF EXISTS "Users can update their own booking requests" ON public.booking_requests;

-- Recreate with proper scoping: only owner can update their own requests
CREATE POLICY "Users can update their own booking requests"
  ON public.booking_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);