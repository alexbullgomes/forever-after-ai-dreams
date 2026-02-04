-- ================================================
-- Campaign Packages Refactoring Migration
-- ================================================

-- 1. Create campaign_packages table
CREATE TABLE public.campaign_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  
  -- Display/Content
  title TEXT NOT NULL,
  price_display TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  ideal_for TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  
  -- Booking Configuration
  minimum_deposit_cents INTEGER NOT NULL DEFAULT 15000,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_campaign_packages_campaign_id ON campaign_packages(campaign_id);

-- RLS policies
ALTER TABLE campaign_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view enabled packages" ON campaign_packages
  FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage packages" ON campaign_packages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add package_id to booking_requests
ALTER TABLE booking_requests 
  ADD COLUMN package_id UUID REFERENCES campaign_packages(id);

-- 3. Add package_id to booking_slot_holds
ALTER TABLE booking_slot_holds 
  ADD COLUMN package_id UUID REFERENCES campaign_packages(id);

-- 4. CRITICAL: Make bookings.product_id nullable for campaign bookings
ALTER TABLE bookings 
  ALTER COLUMN product_id DROP NOT NULL;

-- 5. Add package_id to bookings
ALTER TABLE bookings 
  ADD COLUMN package_id UUID REFERENCES campaign_packages(id);

-- 6. Migrate existing pricing cards to campaign_packages
-- Card 1
INSERT INTO campaign_packages (campaign_id, title, price_display, description, features, ideal_for, is_popular, is_enabled, minimum_deposit_cents, sort_order)
SELECT 
  id,
  COALESCE(pricing_card_1_title, 'Package 1'),
  COALESCE(pricing_card_1_price, '$150'),
  pricing_card_1_description,
  COALESCE(pricing_card_1_features, '[]'::jsonb),
  pricing_card_1_ideal_for,
  COALESCE(pricing_card_1_popular, false),
  COALESCE(pricing_card_1_enabled, false),
  15000,
  0
FROM promotional_campaigns
WHERE pricing_card_1_enabled = true;

-- Card 2
INSERT INTO campaign_packages (campaign_id, title, price_display, description, features, ideal_for, is_popular, is_enabled, minimum_deposit_cents, sort_order)
SELECT 
  id,
  COALESCE(pricing_card_2_title, 'Package 2'),
  COALESCE(pricing_card_2_price, '$150'),
  pricing_card_2_description,
  COALESCE(pricing_card_2_features, '[]'::jsonb),
  pricing_card_2_ideal_for,
  COALESCE(pricing_card_2_popular, false),
  COALESCE(pricing_card_2_enabled, false),
  15000,
  1
FROM promotional_campaigns
WHERE pricing_card_2_enabled = true;

-- Card 3
INSERT INTO campaign_packages (campaign_id, title, price_display, description, features, ideal_for, is_popular, is_enabled, minimum_deposit_cents, sort_order)
SELECT 
  id,
  COALESCE(pricing_card_3_title, 'Package 3'),
  COALESCE(pricing_card_3_price, '$150'),
  pricing_card_3_description,
  COALESCE(pricing_card_3_features, '[]'::jsonb),
  pricing_card_3_ideal_for,
  COALESCE(pricing_card_3_popular, false),
  COALESCE(pricing_card_3_enabled, false),
  15000,
  2
FROM promotional_campaigns
WHERE pricing_card_3_enabled = true;

-- Create updated_at trigger for campaign_packages
CREATE TRIGGER update_campaign_packages_updated_at
  BEFORE UPDATE ON campaign_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();