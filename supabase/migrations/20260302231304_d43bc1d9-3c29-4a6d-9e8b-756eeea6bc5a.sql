
-- Add Feature Showcase columns to promotional_campaigns
ALTER TABLE public.promotional_campaigns
  ADD COLUMN IF NOT EXISTS showcase_section_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS showcase_eyebrow text,
  ADD COLUMN IF NOT EXISTS showcase_title text,
  ADD COLUMN IF NOT EXISTS showcase_description text,
  ADD COLUMN IF NOT EXISTS showcase_stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS showcase_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS showcase_tabs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS showcase_default_tab text,
  ADD COLUMN IF NOT EXISTS showcase_cta_primary_text text,
  ADD COLUMN IF NOT EXISTS showcase_cta_primary_link text,
  ADD COLUMN IF NOT EXISTS showcase_cta_secondary_text text,
  ADD COLUMN IF NOT EXISTS showcase_cta_secondary_link text;
