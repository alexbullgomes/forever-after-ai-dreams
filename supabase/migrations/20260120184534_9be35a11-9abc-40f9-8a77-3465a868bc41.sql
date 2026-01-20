-- Add explicit DENY policies for unauthenticated access to tables with PII
-- This provides defense-in-depth even though existing policies require authentication

-- visitor_popup_submissions: Ensure no anonymous SELECT access
-- (The existing policies require user_id = auth.uid() but we add explicit deny for clarity)
CREATE POLICY "Deny unauthenticated access to submissions"
  ON public.visitor_popup_submissions
  FOR SELECT
  TO anon
  USING (false);

-- conversations: Ensure no anonymous SELECT access  
-- (The existing policy uses has_role() or customer_id = auth.uid(), both require auth)
CREATE POLICY "Deny unauthenticated access to conversations"
  ON public.conversations
  FOR SELECT
  TO anon
  USING (false);

-- messages: Ensure no anonymous SELECT access (same pattern)
CREATE POLICY "Deny unauthenticated access to messages"
  ON public.messages
  FOR SELECT
  TO anon
  USING (false);