-- Create gallery_cards table
CREATE TABLE public.gallery_cards (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_key text NOT NULL DEFAULT 'homepage',
    slug text,
    title text NOT NULL,
    subtitle text,
    category text NOT NULL,
    location_city text,
    event_season_or_date text,
    thumbnail_url text,
    video_url text,
    video_mp4_url text,
    order_index integer NOT NULL DEFAULT 0,
    featured boolean NOT NULL DEFAULT false,
    is_published boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gallery_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to published cards
CREATE POLICY "Public can view published gallery cards" 
ON public.gallery_cards 
FOR SELECT 
USING (is_published = true);

-- Create policies for admin full access
CREATE POLICY "Admins can view all gallery cards" 
ON public.gallery_cards 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can create gallery cards" 
ON public.gallery_cards 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update gallery cards" 
ON public.gallery_cards 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete gallery cards" 
ON public.gallery_cards 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::text));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_gallery_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gallery_cards_updated_at
    BEFORE UPDATE ON public.gallery_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_gallery_cards_updated_at();

-- Create gallery storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true);

-- Create policies for gallery bucket - public read access
CREATE POLICY "Gallery images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gallery');

-- Create policies for admin write access
CREATE POLICY "Admins can upload gallery images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update gallery images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete gallery images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::text));

-- Insert sample data from existing portfolio
INSERT INTO public.gallery_cards (title, subtitle, category, location_city, event_season_or_date, thumbnail_url, order_index, featured) VALUES
('Sarah & Michael''s Wedding', 'A beautiful celebration of love', 'weddings', 'San Francisco', 'Spring 2024', '/lovable-uploads/160fe8f9-dfe9-4e38-880c-72c42ac5fbdb.png', 1, true),
('Emma & David''s Engagement', 'Capturing the beginning of forever', 'photo', 'Napa Valley', 'Summer 2024', '/lovable-uploads/16b44735-6be5-41eb-b64a-a9cd4a2c8571.png', 2, false),
('Corporate Event Photography', 'Professional business moments', 'photo', 'Los Angeles', 'Fall 2024', '/lovable-uploads/2ee7f946-776a-4a8f-a249-03cd6995cb76.png', 3, false),
('Jessica & Ryan''s Wedding Film', 'Cinematic love story', 'video', 'Santa Barbara', 'Summer 2024', '/lovable-uploads/8218160d-57f7-4efa-9bcf-f22f3074d54a.png', 4, true),
('Lisa & Tom''s Intimate Ceremony', 'Small wedding, big emotions', 'weddings', 'Carmel', 'Winter 2024', '/lovable-uploads/8e45f91c-791f-43b0-8364-50054ece61a5.png', 5, false),
('Brand Photography Session', 'Elevating your business image', 'photo', 'San Diego', 'Spring 2024', '/lovable-uploads/a7af5164-9a69-4921-87dc-4d167dc3b382.png', 6, false);