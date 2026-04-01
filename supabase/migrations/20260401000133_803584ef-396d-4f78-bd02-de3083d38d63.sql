ALTER TABLE campaign_packages
  ADD COLUMN primary_cta_text text,
  ADD COLUMN primary_cta_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN secondary_cta_text text,
  ADD COLUMN secondary_cta_enabled boolean NOT NULL DEFAULT true;