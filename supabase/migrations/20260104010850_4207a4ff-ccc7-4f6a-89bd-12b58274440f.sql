-- Make product_id nullable and add campaign columns to booking_requests
ALTER TABLE booking_requests 
  ALTER COLUMN product_id DROP NOT NULL;

-- Add campaign tracking columns
ALTER TABLE booking_requests 
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES promotional_campaigns(id),
  ADD COLUMN IF NOT EXISTS campaign_card_index integer;

-- Also make product_id nullable in booking_slot_holds for campaign bookings
ALTER TABLE booking_slot_holds
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE booking_slot_holds
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES promotional_campaigns(id);