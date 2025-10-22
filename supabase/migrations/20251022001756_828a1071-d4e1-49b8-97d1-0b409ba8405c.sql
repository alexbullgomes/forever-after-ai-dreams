-- Add tracking_scripts JSONB column to promotional_campaigns table
ALTER TABLE promotional_campaigns
ADD COLUMN IF NOT EXISTS tracking_scripts JSONB DEFAULT '[]'::jsonb;