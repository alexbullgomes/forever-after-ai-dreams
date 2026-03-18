ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS thumb_image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS thumb_mp4_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS thumb_webm_url text DEFAULT NULL;