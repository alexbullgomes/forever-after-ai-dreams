ALTER TABLE public.products ADD COLUMN booking_reserve_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN booking_reserve_amount numeric DEFAULT null;
ALTER TABLE public.products ADD COLUMN show_full_price boolean NOT NULL DEFAULT true;