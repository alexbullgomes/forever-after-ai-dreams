-- Create promotional_campaigns table
CREATE TABLE promotional_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Campaign identification
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  
  -- Banner section
  banner_video_url TEXT,
  banner_poster_url TEXT,
  banner_headline TEXT DEFAULT 'Everafter',
  banner_subheadline TEXT DEFAULT 'Memories That Lasts',
  banner_tagline TEXT DEFAULT 'California-based visual storytelling brand capturing life''s most precious moments through the art of photography and videography',
  
  -- Pricing section (3 cards)
  pricing_card_1_enabled BOOLEAN DEFAULT true,
  pricing_card_1_title TEXT DEFAULT 'Photography Session',
  pricing_card_1_price TEXT DEFAULT '$250–$1200',
  pricing_card_1_description TEXT DEFAULT 'Professional photography capturing your special moments',
  pricing_card_1_features JSONB DEFAULT '["High-resolution digital photos", "Professional editing", "Online gallery", "Print rights included"]'::jsonb,
  pricing_card_1_popular BOOLEAN DEFAULT false,
  pricing_card_1_ideal_for TEXT,
  
  pricing_card_2_enabled BOOLEAN DEFAULT true,
  pricing_card_2_title TEXT DEFAULT 'Photo & Video Combo',
  pricing_card_2_price TEXT DEFAULT 'Personalize',
  pricing_card_2_description TEXT DEFAULT 'Complete coverage with both photography and videography',
  pricing_card_2_features JSONB DEFAULT '["Photography + Videography", "Full day coverage", "Edited video highlights", "Digital photo album", "Cinematic editing"]'::jsonb,
  pricing_card_2_popular BOOLEAN DEFAULT true,
  pricing_card_2_ideal_for TEXT DEFAULT 'Perfect for couples who want comprehensive coverage',
  
  pricing_card_3_enabled BOOLEAN DEFAULT true,
  pricing_card_3_title TEXT DEFAULT 'Videography Session',
  pricing_card_3_price TEXT DEFAULT '$350–$1750',
  pricing_card_3_description TEXT DEFAULT 'Cinematic video production for your event',
  pricing_card_3_features JSONB DEFAULT '["4K video recording", "Drone footage available", "Professional audio", "Highlight reel", "Full ceremony video"]'::jsonb,
  pricing_card_3_popular BOOLEAN DEFAULT false,
  pricing_card_3_ideal_for TEXT,
  
  -- SEO & Social Metadata
  meta_title TEXT,
  meta_description TEXT,
  meta_image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  
  -- Tracking
  views_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_promotional_campaigns_slug ON promotional_campaigns(slug);
CREATE INDEX idx_promotional_campaigns_is_active ON promotional_campaigns(is_active);

-- Enable RLS
ALTER TABLE promotional_campaigns ENABLE ROW LEVEL SECURITY;

-- Public can view active campaigns
CREATE POLICY "Anyone can view active campaigns"
ON promotional_campaigns
FOR SELECT
USING (is_active = true);

-- Admins can view all campaigns
CREATE POLICY "Admins can view all campaigns"
ON promotional_campaigns
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can create campaigns
CREATE POLICY "Admins can create campaigns"
ON promotional_campaigns
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update campaigns
CREATE POLICY "Admins can update campaigns"
ON promotional_campaigns
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete campaigns
CREATE POLICY "Admins can delete campaigns"
ON promotional_campaigns
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promotional_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promotional_campaigns_updated_at
BEFORE UPDATE ON promotional_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_promotional_campaigns_updated_at();