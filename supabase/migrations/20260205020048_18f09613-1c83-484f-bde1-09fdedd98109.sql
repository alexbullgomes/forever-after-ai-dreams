-- Create function to handle hold expiration → LIMITED transition
CREATE OR REPLACE FUNCTION public.handle_hold_expiration_to_limited()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
  v_existing_override availability_overrides%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'expired'
  IF NEW.status = 'expired' AND OLD.status = 'active' THEN
    -- Determine the product_id to use
    v_product_id := NEW.product_id;
    
    -- If no product_id (campaign-only booking), skip override creation
    -- Campaign packages don't have per-slot availability in this version
    IF v_product_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Check if an override already exists for this date
    SELECT * INTO v_existing_override
    FROM availability_overrides
    WHERE product_id = v_product_id
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
        v_product_id,
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

-- Create trigger on booking_slot_holds
DROP TRIGGER IF EXISTS trigger_hold_expiration_to_limited ON booking_slot_holds;
CREATE TRIGGER trigger_hold_expiration_to_limited
  AFTER UPDATE OF status ON booking_slot_holds
  FOR EACH ROW
  WHEN (NEW.status = 'expired' AND OLD.status = 'active')
  EXECUTE FUNCTION handle_hold_expiration_to_limited();