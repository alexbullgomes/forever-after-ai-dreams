-- Create affiliate tracking table
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  visitor_id TEXT,
  conversion_type TEXT NOT NULL, -- 'registration', 'form_submission', 'consultation'
  conversion_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Affiliates policies
CREATE POLICY "Users can view their own affiliate data"
ON public.affiliates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own affiliate account"
ON public.affiliates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate data"
ON public.affiliates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all affiliates"
ON public.affiliates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Referrals policies
CREATE POLICY "Affiliates can view their own referrals"
ON public.referrals
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE affiliates.id = referrals.affiliate_id 
  AND affiliates.user_id = auth.uid()
));

CREATE POLICY "System can create referrals"
ON public.referrals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all referrals"
ON public.referrals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::text));

-- Create indexes for performance
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX idx_referrals_affiliate_id ON public.referrals(affiliate_id);
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);

-- Add referral tracking to profiles
ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_name TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    counter INTEGER := 0;
BEGIN
    -- Create base code from user name or random string
    IF user_name IS NOT NULL AND length(trim(user_name)) > 0 THEN
        base_code := upper(regexp_replace(trim(user_name), '[^a-zA-Z0-9]', '', 'g'));
        base_code := substring(base_code from 1 for 8);
    ELSE
        base_code := 'REF';
    END IF;
    
    -- Ensure minimum length
    IF length(base_code) < 3 THEN
        base_code := 'REF' || base_code;
    END IF;
    
    -- Try to find unique code
    final_code := base_code || to_char(floor(random() * 1000), 'FM000');
    
    -- Check uniqueness and increment if needed
    WHILE EXISTS (SELECT 1 FROM public.affiliates WHERE referral_code = final_code) LOOP
        counter := counter + 1;
        final_code := base_code || to_char(floor(random() * 1000) + counter, 'FM000');
        
        -- Prevent infinite loop
        IF counter > 100 THEN
            final_code := 'REF' || to_char(extract(epoch from now())::bigint % 100000, 'FM00000');
            EXIT;
        END IF;
    END LOOP;
    
    RETURN final_code;
END;
$$;

-- Function to track referral conversion
CREATE OR REPLACE FUNCTION public.track_referral_conversion(
    p_referral_code TEXT,
    p_conversion_type TEXT,
    p_conversion_data JSONB DEFAULT '{}',
    p_visitor_id TEXT DEFAULT NULL,
    p_referred_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_affiliate_id UUID;
    v_referral_id UUID;
BEGIN
    -- Find affiliate by referral code
    SELECT id INTO v_affiliate_id
    FROM public.affiliates
    WHERE referral_code = p_referral_code AND is_active = true;
    
    -- Only proceed if affiliate exists
    IF v_affiliate_id IS NOT NULL THEN
        -- Create referral record
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
        
        -- Update affiliate stats
        UPDATE public.affiliates
        SET 
            total_referrals = total_referrals + 1,
            updated_at = now()
        WHERE id = v_affiliate_id;
        
        -- Update referred user profile if provided
        IF p_referred_user_id IS NOT NULL THEN
            UPDATE public.profiles
            SET referred_by = v_affiliate_id
            WHERE id = p_referred_user_id;
        END IF;
        
        RETURN v_referral_id;
    END IF;
    
    RETURN NULL;
END;
$$;