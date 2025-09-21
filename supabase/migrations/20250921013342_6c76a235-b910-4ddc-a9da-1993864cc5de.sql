-- Update existing category values to match frontend labels exactly
UPDATE public.gallery_cards 
SET category = 'Photo & Videos' 
WHERE category IN ('photo', 'video');

UPDATE public.gallery_cards 
SET category = 'Weddings' 
WHERE category = 'weddings';