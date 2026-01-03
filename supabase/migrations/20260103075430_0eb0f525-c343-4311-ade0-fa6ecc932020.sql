-- Create products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  
  -- Editable fields
  title text NOT NULL,
  slug text UNIQUE,
  price numeric NOT NULL,
  currency text DEFAULT 'USD',
  price_unit text DEFAULT 'per night',
  description text,
  image_url text,
  days integer DEFAULT 0,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  cta_text text DEFAULT 'Reserve',
  cta_link text
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can create products"
  ON public.products FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (has_role(auth.uid(), 'admin'::text));

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_products_updated_at();