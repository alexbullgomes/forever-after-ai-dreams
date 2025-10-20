-- Update brand_colors in site_settings to include contact section background gradient tokens
UPDATE site_settings
SET value = jsonb_set(
  jsonb_set(
    value::jsonb,
    '{contact_bg_gradient_from}',
    '"222 47 11"'
  ),
  '{contact_bg_gradient_to}',
  '"350 89 60"'
)
WHERE key = 'brand_colors';