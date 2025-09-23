-- Create our_portfolio_gallery table with identical schema to service_gallery_cards
CREATE TABLE public.our_portfolio_gallery (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_index integer NOT NULL DEFAULT 0,
    featured boolean NOT NULL DEFAULT false,
    is_published boolean NOT NULL DEFAULT true,
    full_video_enabled boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
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
    full_video_url text
);

-- Create business_contents_gallery table with identical schema
CREATE TABLE public.business_contents_gallery (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_index integer NOT NULL DEFAULT 0,
    featured boolean NOT NULL DEFAULT false,
    is_published boolean NOT NULL DEFAULT true,
    full_video_enabled boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
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
    full_video_url text
);

-- Create our_wedding_gallery table with identical schema
CREATE TABLE public.our_wedding_gallery (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_index integer NOT NULL DEFAULT 0,
    featured boolean NOT NULL DEFAULT false,
    is_published boolean NOT NULL DEFAULT true,
    full_video_enabled boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
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
    full_video_url text
);

-- Enable RLS for all three tables
ALTER TABLE public.our_portfolio_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_contents_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.our_wedding_gallery ENABLE ROW LEVEL SECURITY;

-- Create identical RLS policies for our_portfolio_gallery
CREATE POLICY "Public can view published portfolio gallery cards" 
ON public.our_portfolio_gallery 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can view all portfolio gallery cards" 
ON public.our_portfolio_gallery 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can create portfolio gallery cards" 
ON public.our_portfolio_gallery 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update portfolio gallery cards" 
ON public.our_portfolio_gallery 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete portfolio gallery cards" 
ON public.our_portfolio_gallery 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::text));

-- Create identical RLS policies for business_contents_gallery
CREATE POLICY "Public can view published business contents gallery cards" 
ON public.business_contents_gallery 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can view all business contents gallery cards" 
ON public.business_contents_gallery 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can create business contents gallery cards" 
ON public.business_contents_gallery 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update business contents gallery cards" 
ON public.business_contents_gallery 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete business contents gallery cards" 
ON public.business_contents_gallery 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::text));

-- Create identical RLS policies for our_wedding_gallery
CREATE POLICY "Public can view published wedding gallery cards" 
ON public.our_wedding_gallery 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can view all wedding gallery cards" 
ON public.our_wedding_gallery 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can create wedding gallery cards" 
ON public.our_wedding_gallery 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can update wedding gallery cards" 
ON public.our_wedding_gallery 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::text));

CREATE POLICY "Admins can delete wedding gallery cards" 
ON public.our_wedding_gallery 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::text));

-- Create triggers for updating updated_at column
CREATE TRIGGER update_our_portfolio_gallery_updated_at
    BEFORE UPDATE ON public.our_portfolio_gallery
    FOR EACH ROW
    EXECUTE FUNCTION public.update_gallery_cards_updated_at();

CREATE TRIGGER update_business_contents_gallery_updated_at
    BEFORE UPDATE ON public.business_contents_gallery
    FOR EACH ROW
    EXECUTE FUNCTION public.update_gallery_cards_updated_at();

CREATE TRIGGER update_our_wedding_gallery_updated_at
    BEFORE UPDATE ON public.our_wedding_gallery
    FOR EACH ROW
    EXECUTE FUNCTION public.update_gallery_cards_updated_at();

-- Insert seed data for our_portfolio_gallery
INSERT INTO public.our_portfolio_gallery (title, category, subtitle, thumbnail_url, order_index, featured, is_published) VALUES
('Creative Portrait Session', 'Portrait', 'Artistic portrait photography showcasing personality and style', '/lovable-uploads/160fe8f9-dfe9-4e38-880c-72c42ac5fbdb.png', 1, true, true),
('Corporate Headshots', 'Business', 'Professional headshots for corporate teams and executives', '/lovable-uploads/16b44735-6be5-41eb-b64a-a9cd4a2c8571.png', 2, false, true),
('Family Lifestyle Session', 'Family', 'Natural family moments captured in beautiful outdoor settings', '/lovable-uploads/2ee7f946-776a-4a8f-a249-03cd6995cb76.png', 3, true, true),
('Event Photography', 'Events', 'Comprehensive event coverage with candid and posed shots', '/lovable-uploads/8218160d-57f7-4efa-9bcf-f22f3074d54a.png', 4, false, true);

-- Insert seed data for business_contents_gallery
INSERT INTO public.business_contents_gallery (title, category, subtitle, thumbnail_url, order_index, featured, is_published) VALUES
('Brand Campaign Shoot', 'Commercial', 'High-impact commercial photography for brand marketing campaigns', '/lovable-uploads/8e45f91c-791f-43b0-8364-50054ece61a5.png', 1, true, true),
('Product Photography', 'Product', 'Professional product shots for e-commerce and marketing materials', '/lovable-uploads/a7af5164-9a69-4921-87dc-4d167dc3b382.png', 2, false, true),
('Corporate Event Coverage', 'Corporate', 'Complete documentation of corporate events and conferences', '/lovable-uploads/e4d4b04a-7d06-4b7d-9e8c-4b85c7039d41.png', 3, true, true),
('Team Building Documentation', 'Corporate', 'Capturing team dynamics and company culture moments', '/lovable-uploads/160fe8f9-dfe9-4e38-880c-72c42ac5fbdb.png', 4, false, true);

-- Insert seed data for our_wedding_gallery
INSERT INTO public.our_wedding_gallery (title, category, subtitle, thumbnail_url, order_index, featured, is_published) VALUES
('Romantic Garden Wedding', 'Wedding', 'Intimate garden ceremony with natural beauty and elegance', '/lovable-uploads/16b44735-6be5-41eb-b64a-a9cd4a2c8571.png', 1, true, true),
('Elegant Ballroom Reception', 'Wedding', 'Sophisticated ballroom celebration with timeless romance', '/lovable-uploads/2ee7f946-776a-4a8f-a249-03cd6995cb76.png', 2, false, true),
('Beach Wedding Ceremony', 'Wedding', 'Coastal wedding with ocean views and sunset celebrations', '/lovable-uploads/8218160d-57f7-4efa-9bcf-f22f3074d54a.png', 3, true, true),
('Rustic Barn Wedding', 'Wedding', 'Charming countryside wedding with rustic elegance', '/lovable-uploads/8e45f91c-791f-43b0-8364-50054ece61a5.png', 4, false, true);