-- Update the track_referral_conversion function to prevent duplicate referrals
CREATE OR REPLACE FUNCTION public.track_referral_conversion(
    p_referral_code text, 
    p_conversion_type text, 
    p_conversion_data jsonb DEFAULT '{}'::jsonb, 
    p_visitor_id text DEFAULT NULL::text, 
    p_referred_user_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_affiliate_id UUID;
    v_referral_id UUID;
    v_existing_referral_id UUID;
BEGIN
    -- Find affiliate by referral code
    SELECT id INTO v_affiliate_id
    FROM public.affiliates
    WHERE referral_code = p_referral_code AND is_active = true;
    
    -- Only proceed if affiliate exists
    IF v_affiliate_id IS NOT NULL THEN
        -- Check if a referral already exists for this user
        IF p_referred_user_id IS NOT NULL THEN
            SELECT id INTO v_existing_referral_id
            FROM public.referrals
            WHERE affiliate_id = v_affiliate_id 
            AND referred_user_id = p_referred_user_id;
            
            -- If referral already exists, return the existing ID
            IF v_existing_referral_id IS NOT NULL THEN
                RETURN v_existing_referral_id;
            END IF;
        END IF;
        
        -- Create referral record only if one doesn't exist
        INSERT INTO public.referrals (
            affiliate_id,
            referred_user_id,
            referral_code,
            visitor_id,
            conversion_type,
            conversion_data
        ) VALUES (
            v_affiliate_id,
            p_referred_user_id,
            p_referral_code,
            p_visitor_id,
            p_conversion_type,
            p_conversion_data
        ) RETURNING id INTO v_referral_id;
        
        -- Update affiliate stats only for new referrals
        UPDATE public.affiliates
        SET 
            total_referrals = total_referrals + 1,
            updated_at = now()
        WHERE id = v_affiliate_id;
        
        -- Update referred user profile if provided
        IF p_referred_user_id IS NOT NULL THEN
            UPDATE public.profiles
            SET referred_by = v_affiliate_id
            WHERE id = p_referred_user_id AND referred_by IS NULL;
        END IF;
        
        RETURN v_referral_id;
    END IF;
    
    RETURN NULL;
END;
$function$;