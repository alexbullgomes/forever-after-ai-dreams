-- Create RPC function for batch updating profile sort orders
CREATE OR REPLACE FUNCTION public.update_profile_sort_orders(updates JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    update_record JSONB;
BEGIN
    -- Loop through each update in the JSONB array
    FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
    LOOP
        UPDATE public.profiles 
        SET sort_order = (update_record->>'sort_order')::INTEGER
        WHERE id = (update_record->>'id')::UUID;
    END LOOP;
END;
$$;