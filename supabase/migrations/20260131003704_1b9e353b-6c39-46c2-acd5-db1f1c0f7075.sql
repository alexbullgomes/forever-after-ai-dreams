-- Add pricing_section_enabled to promotional_campaigns
ALTER TABLE promotional_campaigns 
ADD COLUMN IF NOT EXISTS pricing_section_enabled boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN promotional_campaigns.pricing_section_enabled IS 
  'Controls visibility of the Special Promotional Packages section on campaign landing pages';