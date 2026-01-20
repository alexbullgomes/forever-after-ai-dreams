-- Allow service role (used by webhook) to insert bookings
-- The stripe-webhook edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- But we need to ensure the insert policy allows system/service role access

CREATE POLICY "Service role can insert bookings"
  ON public.bookings
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update booking slot holds"
  ON public.booking_slot_holds
  FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can update booking requests"  
  ON public.booking_requests
  FOR UPDATE
  TO service_role
  USING (true);