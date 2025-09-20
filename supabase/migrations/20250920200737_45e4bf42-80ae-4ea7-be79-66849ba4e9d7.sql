-- Add video thumbnail fields to gallery_cards table
ALTER TABLE public.gallery_cards 
ADD COLUMN thumb_webm_url text,
ADD COLUMN thumb_mp4_url text,
ADD COLUMN thumb_image_url text;