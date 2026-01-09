-- Add video support to products table
ALTER TABLE products
ADD COLUMN video_url TEXT,
ADD COLUMN media_type TEXT DEFAULT 'image';

-- Add check constraint for media_type
ALTER TABLE products
ADD CONSTRAINT products_media_type_check CHECK (media_type IN ('image', 'video'));

COMMENT ON COLUMN products.video_url IS 'Optional video URL (MP4/WEBM) for the product hero';
COMMENT ON COLUMN products.media_type IS 'Media type: image or video (auto-detected from URL if not set)';