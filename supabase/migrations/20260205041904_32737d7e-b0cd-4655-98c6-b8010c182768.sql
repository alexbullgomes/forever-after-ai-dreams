-- Phase 1: Fix SQL slot status logic
-- The overloaded function (date, time, time version) has the correct logic already
-- Update the timestamptz version to match

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
  SELECT * INTO v_override
  FROM availability_overrides
  WHERE product_id IS NULL AND date = v_date::text
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
  
  -- Determine status (FIXED: only mark limited when capacity > 1 AND exactly 1 slot remains)
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

-- Phase 2: Update global rule to daily_capacity=2
UPDATE availability_rules 
SET daily_capacity = 2, updated_at = now()
WHERE product_id IS NULL AND is_active = true;

-- Phase 3: Deactivate legacy per-product rules
UPDATE availability_rules 
SET is_active = false, updated_at = now()
WHERE product_id IS NOT NULL AND is_active = true;

-- Phase 4: Normalize overrides to status-only (remove capacity_override)
UPDATE availability_overrides 
SET capacity_override = NULL
WHERE capacity_override IS NOT NULL;