-- Step 1: Fix the type mismatch bug in get_global_slot_availability (timestamptz version)
-- The bug was: WHERE product_id IS NULL AND date = v_date::text
-- The fix: WHERE product_id IS NULL AND date = v_date

CREATE OR REPLACE FUNCTION public.get_global_slot_availability(p_slot_start timestamp with time zone, p_slot_end timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    v_capacity := 2; -- Default 2 sessions per day
  ELSE
    IF v_global_rules.capacity_type = 'slot' THEN
      v_capacity := v_global_rules.slot_capacity;
    ELSE
      v_capacity := v_global_rules.daily_capacity;
    END IF;
  END IF;
  
  -- Check for GLOBAL override (product_id IS NULL) - date-based first
  -- FIX: Use proper date comparison instead of text cast
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
    
    -- For 'available' override, continue to compute actual usage
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
  
  -- Determine status (only mark limited when capacity > 1 AND exactly 1 slot remains)
  IF v_used >= v_capacity THEN
    v_status := 'full';
    v_reason := 'Capacity reached (' || v_used || '/' || v_capacity || ')';
  ELSIF v_capacity > 1 AND v_capacity - v_used = 1 THEN
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
$function$;

-- Step 2: Fix the date/time version as well
CREATE OR REPLACE FUNCTION public.get_global_slot_availability(p_event_date date, p_start_time time without time zone, p_end_time time without time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
    -- Fallback to available instead of needs_review
    RETURN jsonb_build_object(
      'status', 'available',
      'capacity', 2,
      'used', 0,
      'message', 'Using default availability (no rules configured)'
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
  -- FIX: Use proper date comparison instead of text cast
  SELECT status, capacity_override INTO v_override_status, v_override_capacity
  FROM availability_overrides
  WHERE product_id IS NULL
    AND date = p_event_date
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
$function$;

-- Step 3: Fix get_global_day_availability to also use proper date comparison
CREATE OR REPLACE FUNCTION public.get_global_day_availability(p_day date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- If no global rules, return available as default (not needs_review)
  IF v_global_rules.id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'available',
      'reason', 'Using default availability (no global rules)',
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
  -- FIX: Use proper date comparison
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
$function$;

-- Step 4: Clean up duplicate overrides, keeping only the most recent per date
DELETE FROM availability_overrides a
USING (
  SELECT date, MAX(created_at) as max_created
  FROM availability_overrides
  WHERE product_id IS NULL AND date IS NOT NULL
  GROUP BY date
  HAVING COUNT(*) > 1
) b
WHERE a.product_id IS NULL 
  AND a.date IS NOT NULL 
  AND a.date = b.date 
  AND a.created_at < b.max_created;

-- Step 5: Create unique partial index to prevent future duplicates
DROP INDEX IF EXISTS idx_availability_overrides_global_date;
DROP INDEX IF EXISTS idx_availability_overrides_global_date_unique;
CREATE UNIQUE INDEX idx_availability_overrides_global_date_unique
ON availability_overrides (date) 
WHERE product_id IS NULL AND date IS NOT NULL;