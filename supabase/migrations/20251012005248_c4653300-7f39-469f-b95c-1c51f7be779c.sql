-- Add promotional_footer_enabled column to promotional_campaigns table
ALTER TABLE promotional_campaigns 
ADD COLUMN promotional_footer_enabled BOOLEAN DEFAULT false;