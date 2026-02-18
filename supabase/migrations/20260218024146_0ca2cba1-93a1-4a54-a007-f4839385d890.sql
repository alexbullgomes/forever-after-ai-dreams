ALTER TABLE public.bookings ADD COLUMN stripe_checkout_session_id text;
ALTER TABLE public.bookings ADD COLUMN amount_paid integer;