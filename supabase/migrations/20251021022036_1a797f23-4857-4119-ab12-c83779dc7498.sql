-- Update brand_colors in site_settings to include CTA section icon color token
UPDATE site_settings
SET value = jsonb_set(
  value::jsonb,
  '{cta_icon_color}',
  '"244 63 94"'
)
WHERE key = 'brand_colors';