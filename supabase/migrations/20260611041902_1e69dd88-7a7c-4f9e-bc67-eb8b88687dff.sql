ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS visitor_full_name text,
  ADD COLUMN IF NOT EXISTS visitor_name_updated_at timestamptz;

ALTER TABLE public.visitors
  ADD COLUMN IF NOT EXISTS visitor_full_name text,
  ADD COLUMN IF NOT EXISTS visitor_name_updated_at timestamptz;