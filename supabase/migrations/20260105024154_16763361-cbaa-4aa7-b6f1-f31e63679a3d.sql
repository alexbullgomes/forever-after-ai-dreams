-- =====================================================
-- AVAILABILITY MANAGEMENT SYSTEM
-- =====================================================

-- 1. Create availability_rules table
CREATE TABLE public.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  workdays integer[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  start_time time NOT NULL DEFAULT '10:00',
  end_time time NOT NULL DEFAULT '18:00',
  slot_minutes integer NOT NULL DEFAULT 60,
  buffer_minutes integer NOT NULL DEFAULT 0,
  capacity_type text NOT NULL DEFAULT 'daily' CHECK (capacity_type IN ('daily', 'slot')),
  daily_capacity integer NOT NULL DEFAULT 1,
  slot_capacity integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for availability_rules
CREATE INDEX idx_availability_rules_product_active ON public.availability_rules(product_id, is_active);

-- RLS for availability_rules
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can CRUD availability rules"
  ON public.availability_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active rules"
  ON public.availability_rules FOR SELECT
  USING (is_active = true);

-- 2. Create availability_overrides table
CREATE TABLE public.availability_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  start_at timestamptz NULL,
  end_at timestamptz NULL,
  date date NULL,
  status text NOT NULL CHECK (status IN ('available', 'limited', 'full', 'blocked')),
  capacity_override integer NULL,
  reason text NULL,
  created_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_override_type CHECK (
    (date IS NOT NULL AND start_at IS NULL AND end_at IS NULL) OR
    (date IS NULL AND start_at IS NOT NULL AND end_at IS NOT NULL)
  )
);

-- Indexes for availability_overrides
CREATE INDEX idx_availability_overrides_product_date ON public.availability_overrides(product_id, date);
CREATE INDEX idx_availability_overrides_product_start ON public.availability_overrides(product_id, start_at);

-- RLS for availability_overrides
ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can CRUD availability overrides"
  ON public.availability_overrides FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view overrides"
  ON public.availability_overrides FOR SELECT
  USING (true);

-- 3. Add columns to booking_slot_holds if they don't exist
ALTER TABLE public.booking_slot_holds 
  ADD COLUMN IF NOT EXISTS visitor_id text NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS source text NULL;

-- Additional indexes for booking_slot_holds
CREATE INDEX IF NOT EXISTS idx_booking_slot_holds_expires 
  ON public.booking_slot_holds(expires_at);

CREATE INDEX IF NOT EXISTS idx_booking_slot_holds_product_start_expires 
  ON public.booking_slot_holds(product_id, start_time, expires_at);

-- 4. Create availability_audit_log table
CREATE TABLE public.availability_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor_id uuid NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for availability_audit_log
ALTER TABLE public.availability_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON public.availability_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit log"
  ON public.availability_audit_log FOR INSERT
  WITH CHECK (true);

-- 5. Create get_slot_availability function
CREATE OR REPLACE FUNCTION public.get_slot_availability(
  p_product_id uuid,
  p_slot_start timestamptz,
  p_slot_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rules availability_rules%ROWTYPE;
  v_override availability_overrides%ROWTYPE;
  v_slot_date date;
  v_capacity integer;
  v_used integer;
  v_status text;
  v_reason text;
  v_override_applied boolean := false;
BEGIN
  -- Handle NULL product_id
  IF p_product_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'needs_review',
      'reason', 'Missing product_id',
      'capacity', 0,
      'used', 0,
      'override_applied', false
    );
  END IF;

  -- Get rules
  SELECT * INTO v_rules
  FROM availability_rules
  WHERE product_id = p_product_id AND is_active = true
  LIMIT 1;

  IF v_rules.id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'needs_review',
      'reason', 'No active availability rules found',
      'capacity', 0,
      'used', 0,
      'override_applied', false
    );
  END IF;

  -- Get the date in the product's timezone
  v_slot_date := (p_slot_start AT TIME ZONE v_rules.timezone)::date;

  -- Check for date-based override first
  SELECT * INTO v_override
  FROM availability_overrides
  WHERE product_id = p_product_id AND date = v_slot_date
  LIMIT 1;

  -- If no date override, check time-range override
  IF v_override.id IS NULL THEN
    SELECT * INTO v_override
    FROM availability_overrides
    WHERE product_id = p_product_id
      AND start_at IS NOT NULL
      AND p_slot_start < end_at
      AND p_slot_end > start_at
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Apply override if found
  IF v_override.id IS NOT NULL THEN
    v_override_applied := true;
    
    IF v_override.status = 'blocked' THEN
      RETURN jsonb_build_object(
        'status', 'blocked',
        'reason', COALESCE(v_override.reason, 'Blocked by admin'),
        'capacity', 0,
        'used', 0,
        'override_applied', true
      );
    END IF;
    
    IF v_override.status = 'full' THEN
      RETURN jsonb_build_object(
        'status', 'full',
        'reason', COALESCE(v_override.reason, 'Marked as full by admin'),
        'capacity', 0,
        'used', 0,
        'override_applied', true
      );
    END IF;
    
    IF v_override.capacity_override IS NOT NULL THEN
      v_capacity := v_override.capacity_override;
    END IF;
  END IF;

  -- Determine capacity from rules if not overridden
  IF v_capacity IS NULL THEN
    IF v_rules.capacity_type = 'slot' THEN
      v_capacity := v_rules.slot_capacity;
    ELSE
      v_capacity := v_rules.daily_capacity;
    END IF;
  END IF;

  -- Count used slots (confirmed bookings + active holds)
  IF v_rules.capacity_type = 'slot' THEN
    SELECT COUNT(*) INTO v_used
    FROM (
      SELECT id FROM bookings
      WHERE product_id = p_product_id
        AND event_date = v_slot_date
        AND status IN ('confirmed', 'paid')
      UNION ALL
      SELECT id FROM booking_slot_holds
      WHERE product_id = p_product_id
        AND event_date = v_slot_date
        AND status = 'active'
        AND expires_at > now()
    ) combined;
  ELSE
    SELECT COUNT(*) INTO v_used
    FROM (
      SELECT id FROM bookings
      WHERE product_id = p_product_id
        AND event_date = v_slot_date
        AND status IN ('confirmed', 'paid')
      UNION ALL
      SELECT id FROM booking_slot_holds
      WHERE product_id = p_product_id
        AND event_date = v_slot_date
        AND status = 'active'
        AND expires_at > now()
    ) combined;
  END IF;

  -- Determine final status
  IF v_used >= v_capacity THEN
    v_status := 'full';
    v_reason := 'Capacity reached (' || v_used || '/' || v_capacity || ')';
  ELSIF v_used = v_capacity - 1 THEN
    v_status := 'limited';
    v_reason := 'Only 1 slot remaining';
  ELSIF v_override.id IS NOT NULL AND v_override.status = 'limited' THEN
    v_status := 'limited';
    v_reason := COALESCE(v_override.reason, 'Limited availability');
  ELSE
    v_status := 'available';
    v_reason := 'Open (' || (v_capacity - v_used) || ' of ' || v_capacity || ' available)';
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'reason', v_reason,
    'capacity', v_capacity,
    'used', v_used,
    'override_applied', v_override_applied
  );
END;
$$;

-- 6. Create get_day_availability function
CREATE OR REPLACE FUNCTION public.get_day_availability(
  p_product_id uuid,
  p_day date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rules availability_rules%ROWTYPE;
  v_slots jsonb := '[]'::jsonb;
  v_slot_start time;
  v_slot_end time;
  v_slot_availability jsonb;
  v_day_status text := 'available';
  v_available_count integer := 0;
  v_total_count integer := 0;
  v_day_of_week integer;
  v_override availability_overrides%ROWTYPE;
BEGIN
  -- Handle NULL product_id
  IF p_product_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'needs_review',
      'reason', 'Missing product_id',
      'slots', '[]'::jsonb,
      'available_count', 0,
      'total_count', 0
    );
  END IF;

  -- Get rules
  SELECT * INTO v_rules
  FROM availability_rules
  WHERE product_id = p_product_id AND is_active = true
  LIMIT 1;

  IF v_rules.id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'needs_review',
      'reason', 'No active availability rules found',
      'slots', '[]'::jsonb,
      'available_count', 0,
      'total_count', 0
    );
  END IF;

  -- Check if day is a workday (0=Sunday, 6=Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_day)::integer;
  IF NOT (v_day_of_week = ANY(v_rules.workdays)) THEN
    RETURN jsonb_build_object(
      'status', 'blocked',
      'reason', 'Not a working day',
      'slots', '[]'::jsonb,
      'available_count', 0,
      'total_count', 0
    );
  END IF;

  -- Check for day-level override
  SELECT * INTO v_override
  FROM availability_overrides
  WHERE product_id = p_product_id AND date = p_day
  LIMIT 1;

  IF v_override.id IS NOT NULL AND v_override.status = 'blocked' THEN
    RETURN jsonb_build_object(
      'status', 'blocked',
      'reason', COALESCE(v_override.reason, 'Day blocked by admin'),
      'slots', '[]'::jsonb,
      'available_count', 0,
      'total_count', 0
    );
  END IF;

  -- Generate time slots
  v_slot_start := v_rules.start_time;
  
  WHILE v_slot_start < v_rules.end_time LOOP
    v_slot_end := v_slot_start + (v_rules.slot_minutes || ' minutes')::interval;
    
    IF v_slot_end > v_rules.end_time THEN
      EXIT;
    END IF;

    -- Get availability for this slot
    v_slot_availability := get_slot_availability(
      p_product_id,
      (p_day::text || ' ' || v_slot_start::text)::timestamptz,
      (p_day::text || ' ' || v_slot_end::text)::timestamptz
    );

    v_slots := v_slots || jsonb_build_object(
      'start', v_slot_start::text,
      'end', v_slot_end::text,
      'status', v_slot_availability->>'status',
      'reason', v_slot_availability->>'reason'
    );

    v_total_count := v_total_count + 1;
    IF (v_slot_availability->>'status') IN ('available', 'limited') THEN
      v_available_count := v_available_count + 1;
    END IF;

    v_slot_start := v_slot_end + (v_rules.buffer_minutes || ' minutes')::interval;
  END LOOP;

  -- Determine day status
  IF v_available_count = 0 THEN
    v_day_status := 'full';
  ELSIF v_available_count <= v_total_count * 0.25 THEN
    v_day_status := 'limited';
  ELSIF v_override.id IS NOT NULL AND v_override.status = 'limited' THEN
    v_day_status := 'limited';
  ELSE
    v_day_status := 'available';
  END IF;

  RETURN jsonb_build_object(
    'status', v_day_status,
    'reason', v_available_count || ' of ' || v_total_count || ' slots available',
    'slots', v_slots,
    'available_count', v_available_count,
    'total_count', v_total_count
  );
END;
$$;

-- 7. Create updated_at trigger for availability_rules
CREATE OR REPLACE FUNCTION public.update_availability_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_availability_rules_updated_at
  BEFORE UPDATE ON public.availability_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_availability_rules_updated_at();