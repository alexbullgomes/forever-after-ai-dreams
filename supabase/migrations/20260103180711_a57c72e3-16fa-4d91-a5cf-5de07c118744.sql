-- Add new text fields to replace Days and Rating
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coverage_text text DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deliverable_text text DEFAULT '';

-- Add highlight feature columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_highlighted boolean DEFAULT false NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS highlight_label text DEFAULT 'Special Deal';