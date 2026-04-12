-- Add INSERT policy for admins on site_settings
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed chat_config row so future saves only need UPDATE
INSERT INTO public.site_settings (key, value)
VALUES ('chat_config', '{}')
ON CONFLICT (key) DO NOTHING;