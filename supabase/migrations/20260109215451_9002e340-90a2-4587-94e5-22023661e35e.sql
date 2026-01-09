-- Add show_in_our_products column to products table
ALTER TABLE public.products 
ADD COLUMN show_in_our_products BOOLEAN NOT NULL DEFAULT true;

-- Create composite index for efficient filtering on public pages
CREATE INDEX idx_products_active_show_in_our_products 
ON public.products (is_active, show_in_our_products) 
WHERE is_active = true AND show_in_our_products = true;