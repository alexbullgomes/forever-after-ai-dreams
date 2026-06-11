ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS phone_country_dial_code text,
  ADD COLUMN IF NOT EXISTS phone_national text,
  ADD COLUMN IF NOT EXISTS phone_updated_at timestamptz;

ALTER TABLE public.visitors
  ADD COLUMN IF NOT EXISTS phone_country_dial_code text,
  ADD COLUMN IF NOT EXISTS phone_national text,
  ADD COLUMN IF NOT EXISTS phone_updated_at timestamptz;