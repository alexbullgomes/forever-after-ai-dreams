-- Add vendor section configuration to promotional_campaigns
ALTER TABLE promotional_campaigns
ADD COLUMN IF NOT EXISTS vendors_section_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS vendors_section_headline text DEFAULT 'Our Partners',
ADD COLUMN IF NOT EXISTS vendors_section_description text;

-- Create campaign_vendors table
CREATE TABLE campaign_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  website_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_campaign_vendors_campaign_id ON campaign_vendors(campaign_id);
CREATE INDEX idx_campaign_vendors_sort_order ON campaign_vendors(campaign_id, sort_order);

-- Enable RLS
ALTER TABLE campaign_vendors ENABLE ROW LEVEL SECURITY;

-- Public read access for active vendors
CREATE POLICY "Anyone can view active vendors"
ON campaign_vendors FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage vendors"
ON campaign_vendors FOR ALL
USING (has_role(auth.uid(), 'admin'::text));

-- Trigger for updated_at
CREATE TRIGGER update_campaign_vendors_updated_at
  BEFORE UPDATE ON campaign_vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE campaign_vendors IS 'Stores vendor/partner logos for promotional campaigns';
COMMENT ON COLUMN campaign_vendors.logo_url IS 'URL to vendor logo image (SVG preferred for scalability)';
COMMENT ON COLUMN promotional_campaigns.vendors_section_enabled IS 'Controls visibility of the Vendor Section on campaign landing pages';