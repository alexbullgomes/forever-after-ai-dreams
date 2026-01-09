-- Create junction table for campaign-product associations
CREATE TABLE public.promotional_campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.promotional_campaigns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, product_id)
);

-- Add toggle column to promotional_campaigns
ALTER TABLE public.promotional_campaigns
ADD COLUMN products_section_enabled BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.promotional_campaign_products ENABLE ROW LEVEL SECURITY;

-- Public can view active campaign products (for public campaign pages)
CREATE POLICY "Public can view active campaign products"
ON public.promotional_campaign_products FOR SELECT
USING (is_active = true);

-- Admins can manage all campaign products
CREATE POLICY "Admins can manage campaign products"
ON public.promotional_campaign_products FOR ALL
USING (public.has_role(auth.uid(), 'admin'));