-- Restrict booking_slot_holds INSERT to service_role only
DROP POLICY IF EXISTS "Public can create booking slot holds" ON public.booking_slot_holds;

CREATE POLICY "Service role can create booking slot holds"
  ON public.booking_slot_holds
  FOR INSERT
  TO service_role
  WITH CHECK (true);