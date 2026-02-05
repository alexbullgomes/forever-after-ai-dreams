-- ===========================================================
-- PHASE 1: Create Global Availability SQL Functions
-- ===========================================================

-- 1.1 Create get_global_slot_availability function
CREATE OR REPLACE FUNCTION public.get_global_slot_availability(
  p_slot_start timestamptz,
  p_slot_end timestamptz
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_date date;
  v_global_rules availability_rules%ROWTYPE;
  v_override availability_overrides%ROWTYPE;
  v_capacity integer;
  v_used integer;
  v_status text;
  v_reason text;
  v_override_applied boolean := false;
BEGIN
  -- Extract date from slot start (use America/Los_Angeles timezone)
  v_date := (p_slot_start AT TIME ZONE 'America/Los_Angeles')::date;
  
  -- Get GLOBAL rules (product_id IS NULL)
  SELECT * INTO v_global_rules
  FROM availability_rules
  WHERE product_id IS NULL AND is_active = true
  LIMIT 1;
  
  -- If no global rules, fallback to defaults
  IF v_global_rules.id IS NULL THEN
    v_capacity := 1; -- Default single booking per day
  ELSE
    IF v_global_rules.capacity_type = 'slot' THEN
      v_capacity := v_global_rules.slot_capacity;
    ELSE
      v_capacity := v_global_rules.daily_capacity;
    END IF;
  END IF;
  
  -- Check for GLOBAL override (product_id IS NULL) - date-based first
  SELECT * INTO v_override
  FROM availability_overrides
  WHERE product_id IS NULL AND date = v_date
  LIMIT 1;
  
  -- If no date override, check time-range override
  IF v_override.id IS NULL THEN
    SELECT * INTO v_override
    FROM availability_overrides
    WHERE product_id IS NULL
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
    
    IF v_override.status = 'limited' THEN
      RETURN jsonb_build_object(
        'status', 'limited',
        'reason', COALESCE(v_override.reason, 'Limited availability'),
        'capacity', COALESCE(v_override.capacity_override, v_capacity),
        'used', 0,
        'override_applied', true
      );
    END IF;
    
    IF v_override.capacity_override IS NOT NULL THEN
      v_capacity := v_override.capacity_override;
    END IF;
  END IF;
  
  -- Count GLOBAL usage (ALL bookings + active holds for this date, regardless of product/package)
  SELECT COUNT(*) INTO v_used
  FROM (
    SELECT id FROM bookings
    WHERE event_date = v_date AND status IN ('confirmed', 'paid')
    UNION ALL
    SELECT id FROM booking_slot_holds
    WHERE event_date = v_date AND status = 'active' AND expires_at > now()
  ) combined;
  
  -- Determine status
  IF v_used >= v_capacity THEN
    v_status := 'full';
    v_reason := 'Capacity reached (' || v_used || '/' || v_capacity || ')';
  ELSIF v_used = v_capacity - 1 THEN
    v_status := 'limited';
    v_reason := 'Only 1 slot remaining';
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

-- 1.2 Create get_global_day_availability function
CREATE OR REPLACE FUNCTION public.get_global_day_availability(
  p_day date
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_global_rules availability_rules%ROWTYPE;
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
  -- Get GLOBAL rules (product_id IS NULL)
  SELECT * INTO v_global_rules
  FROM availability_rules
  WHERE product_id IS NULL AND is_active = true
  LIMIT 1;
  
  -- If no global rules, return needs_review
  IF v_global_rules.id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'needs_review',
      'reason', 'No global availability rules found',
      'slots', '[]'::jsonb,
      'available_count', 0,
      'total_count', 0
    );
  END IF;
  
  -- Check if day is a workday (0=Sunday, 6=Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_day)::integer;
  IF NOT (v_day_of_week = ANY(v_global_rules.workdays)) THEN
    RETURN jsonb_build_object(
      'status', 'blocked',
      'reason', 'Not a working day',
      'slots', '[]'::jsonb,
      'available_count', 0,
      'total_count', 0
    );
  END IF;
  
  -- Check for day-level GLOBAL override
  SELECT * INTO v_override
  FROM availability_overrides
  WHERE product_id IS NULL AND date = p_day
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
  v_slot_start := v_global_rules.start_time;
  
  WHILE v_slot_start < v_global_rules.end_time LOOP
    v_slot_end := v_slot_start + (v_global_rules.slot_minutes || ' minutes')::interval;
    
    IF v_slot_end > v_global_rules.end_time THEN
      EXIT;
    END IF;
    
    -- Get global availability for this slot
    v_slot_availability := get_global_slot_availability(
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
    
    v_slot_start := v_slot_end + (v_global_rules.buffer_minutes || ' minutes')::interval;
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

-- 1.3 Update handle_hold_expiration_to_limited trigger function to use GLOBAL overrides
CREATE OR REPLACE FUNCTION public.handle_hold_expiration_to_limited()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_override availability_overrides%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'expired'
  IF NEW.status = 'expired' AND OLD.status = 'active' THEN
    -- Check if a GLOBAL override already exists for this date (product_id IS NULL)
    SELECT * INTO v_existing_override
    FROM availability_overrides
    WHERE product_id IS NULL
      AND date = NEW.event_date
    LIMIT 1;
    
    -- Only create LIMITED override if no override exists or existing is 'available'
    IF v_existing_override.id IS NULL THEN
      INSERT INTO availability_overrides (
        product_id,
        date,
        status,
        reason,
        created_by
      ) VALUES (
        NULL, -- GLOBAL override
        NEW.event_date,
        'limited',
        'Expired hold - check with team for availability',
        NULL -- System-generated
      );
    ELSIF v_existing_override.status = 'available' THEN
      UPDATE availability_overrides
      SET status = 'limited',
          reason = 'Expired hold - check with team for availability'
      WHERE id = v_existing_override.id;
    END IF;
    -- If already limited/full/blocked, don't change it
  END IF;
  
  RETURN NEW;
END;
$$;