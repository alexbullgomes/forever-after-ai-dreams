-- =============================================
-- BOOKING FUNNEL TABLES
-- =============================================

-- A) booking_requests - tracks user booking journey
CREATE TABLE public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  visitor_id text,
  event_date date NOT NULL,
  timezone text NOT NULL,
  stage text DEFAULT 'date_selected' NOT NULL,
  offer_expires_at timestamptz NOT NULL,
  availability_version text DEFAULT 'full' NOT NULL,
  selected_time time,
  last_seen_at timestamptz DEFAULT now() NOT NULL,
  stripe_checkout_session_id text,
  CONSTRAINT booking_requests_stage_check CHECK (stage IN ('date_selected', 'time_selected', 'checkout_started', 'paid', 'expired', 'cancelled', 'contacted')),
  CONSTRAINT booking_requests_availability_check CHECK (availability_version IN ('full', 'limited'))
);

-- Create unique index for upsert logic (product + date + user OR visitor)
CREATE UNIQUE INDEX booking_requests_product_date_user_idx 
ON public.booking_requests (product_id, event_date, user_id) 
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX booking_requests_product_date_visitor_idx 
ON public.booking_requests (product_id, event_date, visitor_id) 
WHERE visitor_id IS NOT NULL AND user_id IS NULL;

-- B) booking_slot_holds - temporary holds during checkout
CREATE TABLE public.booking_slot_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  booking_request_id uuid REFERENCES public.booking_requests(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  expires_at timestamptz NOT NULL,
  CONSTRAINT booking_slot_holds_status_check CHECK (status IN ('active', 'released', 'expired', 'converted'))
);

-- Prevent double-booking: only one active or converted hold per slot
CREATE UNIQUE INDEX booking_slot_holds_unique_active_idx 
ON public.booking_slot_holds (product_id, event_date, start_time) 
WHERE status IN ('active', 'converted');

-- C) bookings - confirmed bookings after payment
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  booking_request_id uuid REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'confirmed' NOT NULL,
  stripe_payment_intent text,
  customer_name text,
  customer_email text,
  CONSTRAINT bookings_status_check CHECK (status IN ('confirmed', 'cancelled'))
);

-- D) product_booking_rules - configurable rules per product
CREATE TABLE public.product_booking_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
  slot_duration_minutes int DEFAULT 60 NOT NULL,
  full_window_start time DEFAULT '10:00' NOT NULL,
  full_window_end time DEFAULT '18:00' NOT NULL,
  limited_slots jsonb DEFAULT '["15:00", "16:00", "17:00"]'::jsonb NOT NULL,
  offer_window_hours int DEFAULT 24 NOT NULL,
  checkout_hold_minutes int DEFAULT 15 NOT NULL,
  calendar_mode text DEFAULT 'unavailable' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT product_booking_rules_calendar_mode_check CHECK (calendar_mode IN ('unavailable', 'real'))
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slot_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_booking_rules ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: booking_requests
-- =============================================

-- Users can view their own booking requests (by user_id)
CREATE POLICY "Users can view their own booking requests"
ON public.booking_requests FOR SELECT
USING (auth.uid() = user_id);

-- Allow public to create booking requests (for guests with visitor_id)
CREATE POLICY "Public can create booking requests"
ON public.booking_requests FOR INSERT
WITH CHECK (true);

-- Users can update their own booking requests
CREATE POLICY "Users can update their own booking requests"
ON public.booking_requests FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all booking requests
CREATE POLICY "Admins can view all booking requests"
ON public.booking_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Admins can update all booking requests
CREATE POLICY "Admins can update all booking requests"
ON public.booking_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

-- =============================================
-- RLS POLICIES: booking_slot_holds
-- =============================================

-- Public can create holds (via edge function with service role)
CREATE POLICY "Public can create booking slot holds"
ON public.booking_slot_holds FOR INSERT
WITH CHECK (true);

-- Public can view holds to check availability
CREATE POLICY "Public can view active booking slot holds"
ON public.booking_slot_holds FOR SELECT
USING (status IN ('active', 'converted'));

-- Admins can view all holds
CREATE POLICY "Admins can view all booking slot holds"
ON public.booking_slot_holds FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Admins can update holds
CREATE POLICY "Admins can update booking slot holds"
ON public.booking_slot_holds FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

-- =============================================
-- RLS POLICIES: bookings
-- =============================================

-- Users can view their own confirmed bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Admins can create bookings
CREATE POLICY "Admins can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- Admins can update bookings
CREATE POLICY "Admins can update bookings"
ON public.bookings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

-- =============================================
-- RLS POLICIES: product_booking_rules
-- =============================================

-- Public can read booking rules for active products
CREATE POLICY "Public can view product booking rules"
ON public.product_booking_rules FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.products 
  WHERE products.id = product_booking_rules.product_id 
  AND products.is_active = true
));

-- Admins can CRUD booking rules
CREATE POLICY "Admins can create product booking rules"
ON public.product_booking_rules FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update product booking rules"
ON public.product_booking_rules FOR UPDATE
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete product booking rules"
ON public.product_booking_rules FOR DELETE
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can view all product booking rules"
ON public.product_booking_rules FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_booking_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_booking_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_booking_updated_at();

CREATE TRIGGER update_product_booking_rules_updated_at
  BEFORE UPDATE ON public.product_booking_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_booking_updated_at();