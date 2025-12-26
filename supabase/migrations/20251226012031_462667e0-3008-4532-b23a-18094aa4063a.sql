-- Insert page visibility setting for Wedding Packages toggle
INSERT INTO public.site_settings (key, value)
VALUES ('page_visibility', '{"show_wedding_packages": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;