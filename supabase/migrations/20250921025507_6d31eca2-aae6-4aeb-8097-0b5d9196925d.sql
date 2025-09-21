-- Create service_gallery_cards table with same schema as gallery_cards
CREATE TABLE public.service_gallery_cards (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text,
    title text NOT NULL,
    subtitle text,
    category text NOT NULL,
    location_city text,
    event_season_or_date text,
    thumbnail_url text,
    thumb_webm_url text,
    thumb_mp4_url text,
    thumb_image_url text,
    order_index integer NOT NULL DEFAULT 0,
    featured boolean NOT NULL DEFAULT false,
    is_published boolean NOT NULL DEFAULT true,
    full_video_enabled boolean NOT NULL DEFAULT false,
    full_video_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_gallery_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for service_gallery_cards
CREATE POLICY "Public can view published service gallery cards" 
ON public.service_gallery_cards 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can view all service gallery cards" 
ON public.service_gallery_cards 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can create service gallery cards" 
ON public.service_gallery_cards 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update service gallery cards" 
ON public.service_gallery_cards 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete service gallery cards" 
ON public.service_gallery_cards 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::text));

-- Create trigger for updated_at
CREATE TRIGGER update_service_gallery_cards_updated_at
BEFORE UPDATE ON public.service_gallery_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_gallery_cards_updated_at();

-- Insert initial data based on plannerGalleryData
INSERT INTO public.service_gallery_cards (title, category, thumbnail_url, order_index, featured, is_published) VALUES
('Romantic Sunset Engagement', 'Photo & Videos', '/lovable-uploads/160fe8f9-dfe9-4e38-880c-72c42ac5fbdb.png', 1, true, true),
('Modern Business Portraits', 'Photo & Videos', '/lovable-uploads/16b44735-6be5-41eb-b64a-a9cd4a2c8571.png', 2, true, true),
('Family Joy Moments', 'Photo & Videos', '/lovable-uploads/2ee7f946-776a-4a8f-a249-03cd6995cb76.png', 3, true, true),
('Corporate Event Coverage', 'Photo & Videos', '/lovable-uploads/8218160d-57f7-4efa-9bcf-f22f3074d54a.png', 4, true, true),
('Intimate Wedding Story', 'Weddings', '/lovable-uploads/8e45f91c-791f-43b0-8364-50054ece61a5.png', 5, true, true),
('Brand Photography Session', 'Photo & Videos', '/lovable-uploads/a7af5164-9a69-4921-87dc-4d167dc3b382.png', 6, true, true),
('Anniversary Celebration', 'Photo & Videos', '/lovable-uploads/e4d4b04a-7d06-4b7d-9e8c-4b85c7039d41.png', 7, true, true);