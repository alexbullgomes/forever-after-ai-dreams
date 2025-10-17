-- Restore default brand colors to site_settings table
INSERT INTO public.site_settings (key, value)
VALUES (
  'brand_colors',
  '{"primary_from": "244 63 94", "primary_to": "236 72 153", "primary_hover_from": "225 29 72", "primary_hover_to": "219 39 119"}'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET 
  value = EXCLUDED.value,
  updated_at = now();