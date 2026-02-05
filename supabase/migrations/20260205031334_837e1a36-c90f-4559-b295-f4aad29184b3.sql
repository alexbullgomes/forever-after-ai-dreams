-- Fix the limited status logic in get_global_slot_availability
-- When capacity=1, there's no "limited" state - it's either available or full
-- A slot should be "limited" when there's only 1 remaining slot AND capacity > 1

CREATE OR REPLACE FUNCTION public.get_global_slot_availability(
  p_event_date date,
  p_start_time time,
  p_end_time time
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_rule availability_rules%ROWTYPE;
  v_override_status text;
  v_override_capacity integer;
  v_capacity integer;
  v_used integer;
  v_status text;
  v_day_of_week integer;
BEGIN
  -- Get global rule (product_id IS NULL)
  SELECT * INTO v_rule
  FROM availability_rules
  WHERE product_id IS NULL
    AND is_active = true
  LIMIT 1;
  
  IF v_rule IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'needs_review',
      'capacity', 0,
      'used', 0,
      'message', 'No global availability rules configured'
    );
  END IF;
  
  -- Check if day of week is a workday
  v_day_of_week := EXTRACT(DOW FROM p_event_date)::integer;
  IF NOT (v_day_of_week = ANY(v_rule.workdays)) THEN
    RETURN jsonb_build_object(
      'status', 'blocked',
      'capacity', 0,
      'used', 0,
      'message', 'Not a workday'
    );
  END IF;
  
  -- Check for date-specific override
  SELECT status, capacity_override INTO v_override_status, v_override_capacity
  FROM availability_overrides
  WHERE product_id IS NULL
    AND date = p_event_date::text
  LIMIT 1;
  
  -- If override exists and is blocked/full, return immediately
  IF v_override_status = 'blocked' THEN
    RETURN jsonb_build_object(
      'status', 'blocked',
      'capacity', 0,
      'used', 0,
      'message', 'Day is blocked'
    );
  END IF;
  
  IF v_override_status = 'full' THEN
    RETURN jsonb_build_object(
      'status', 'full',
      'capacity', 0,
      'used', 0,
      'message', 'Day is full'
    );
  END IF;
  
  -- Determine capacity (override takes precedence)
  v_capacity := COALESCE(v_override_capacity, v_rule.daily_capacity);
  
  -- Count confirmed bookings for this date globally
  SELECT COUNT(*) INTO v_used
  FROM bookings
  WHERE event_date = p_event_date
    AND status IN ('confirmed', 'paid');
  
  -- Add active holds globally
  v_used := v_used + (
    SELECT COUNT(*)
    FROM booking_slot_holds
    WHERE event_date = p_event_date
      AND status = 'active'
      AND expires_at > now()
  );
  
  -- Determine status based on usage and capacity
  IF v_used >= v_capacity THEN
    v_status := 'full';
  ELSIF v_override_status = 'limited' THEN
    -- If override explicitly says limited, use that
    v_status := 'limited';
  ELSIF v_override_status = 'available' THEN
    -- If override explicitly says available, use that
    v_status := 'available';
  ELSIF v_capacity > 1 AND v_capacity - v_used = 1 THEN
    -- Only mark as limited when exactly 1 spot remains AND capacity > 1
    -- When capacity=1, it goes directly from available to full (no limited state)
    v_status := 'limited';
  ELSE
    v_status := 'available';
  END IF;
  
  RETURN jsonb_build_object(
    'status', v_status,
    'capacity', v_capacity,
    'used', v_used,
    'available', v_capacity - v_used
  );
END;
$$;