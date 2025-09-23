-- Fix RLS policies for the new gallery tables to match service_gallery_cards
-- These policies were missing for anonymous/public users to read published cards

-- Add missing public read policies for our_portfolio_gallery
CREATE POLICY "Allow anonymous users to view published portfolio gallery cards" 
ON our_portfolio_gallery 
FOR SELECT 
USING (is_published = true);

-- Add missing public read policies for business_contents_gallery  
CREATE POLICY "Allow anonymous users to view published business contents gallery cards" 
ON business_contents_gallery 
FOR SELECT 
USING (is_published = true);

-- Add missing public read policies for our_wedding_gallery
CREATE POLICY "Allow anonymous users to view published wedding gallery cards" 
ON our_wedding_gallery 
FOR SELECT 
USING (is_published = true);