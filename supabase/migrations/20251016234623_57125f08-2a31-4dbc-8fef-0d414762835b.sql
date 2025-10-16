-- Create site_settings table for global configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default brand colors (rose-500 to pink-500)
INSERT INTO public.site_settings (key, value) VALUES
('brand_colors', '{
  "primary_from": "244 63 94",
  "primary_to": "236 72 153",
  "primary_hover_from": "225 29 72",
  "primary_hover_to": "219 39 119"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view site settings
CREATE POLICY "Public can view site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Only admins can update site settings
CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_popups_updated_at();