-- Create promotional_campaign_gallery table
CREATE TABLE promotional_campaign_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  full_video_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT NOT NULL,
  location_city TEXT,
  event_season_or_date TEXT,
  thumbnail_url TEXT,
  thumb_webm_url TEXT,
  thumb_mp4_url TEXT,
  thumb_image_url TEXT,
  full_video_url TEXT,
  slug TEXT
);

-- Create indexes
CREATE INDEX idx_promotional_campaign_gallery_campaign_id 
  ON promotional_campaign_gallery(campaign_id);
CREATE INDEX idx_promotional_campaign_gallery_order 
  ON promotional_campaign_gallery(order_index);
CREATE INDEX idx_promotional_campaign_gallery_published 
  ON promotional_campaign_gallery(is_published);

-- RLS Policies
ALTER TABLE promotional_campaign_gallery ENABLE ROW LEVEL SECURITY;

-- Public can view published items for active campaigns
CREATE POLICY "Anyone can view published campaign gallery items"
  ON promotional_campaign_gallery FOR SELECT
  USING (
    is_published = true 
    AND EXISTS (
      SELECT 1 FROM promotional_campaigns 
      WHERE id = promotional_campaign_gallery.campaign_id 
      AND is_active = true
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all campaign gallery items"
  ON promotional_campaign_gallery FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Admins can insert
CREATE POLICY "Admins can create campaign gallery items"
  ON promotional_campaign_gallery FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update campaign gallery items"
  ON promotional_campaign_gallery FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Admins can delete
CREATE POLICY "Admins can delete campaign gallery items"
  ON promotional_campaign_gallery FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Auto-update trigger
CREATE TRIGGER update_promotional_campaign_gallery_updated_at
  BEFORE UPDATE ON promotional_campaign_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_campaigns_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE promotional_campaign_gallery;