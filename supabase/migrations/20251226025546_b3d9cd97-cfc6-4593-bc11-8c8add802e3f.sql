-- Add redirect fields to gallery_cards table
ALTER TABLE public.gallery_cards 
ADD COLUMN destination_type text DEFAULT 'none',
ADD COLUMN campaign_id uuid REFERENCES public.promotional_campaigns(id) ON DELETE SET NULL,
ADD COLUMN custom_url text;

-- Add index for campaign_id foreign key
CREATE INDEX idx_gallery_cards_campaign_id ON public.gallery_cards(campaign_id);