-- Update brand_colors in site_settings to include services section icon gradient tokens
UPDATE site_settings
SET value = jsonb_set(
  jsonb_set(
    value::jsonb,
    '{service_icon_gradient_from}',
    '"351 95 71"'
  ),
  '{service_icon_gradient_to}',
  '"328 86 70"'
)
WHERE key = 'brand_colors';