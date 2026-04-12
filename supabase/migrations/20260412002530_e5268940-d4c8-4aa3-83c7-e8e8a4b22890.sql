ALTER TABLE public.products
ADD COLUMN has_promotional_price boolean NOT NULL DEFAULT false,
ADD COLUMN promotional_price numeric;