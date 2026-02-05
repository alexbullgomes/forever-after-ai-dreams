-- ===========================================================
-- PHASE 1: Unified Global Availability Calendar
-- Step 1: Make product_id nullable in both tables
-- ===========================================================

-- 1.1 Make availability_rules.product_id nullable to allow global rules
ALTER TABLE availability_rules ALTER COLUMN product_id DROP NOT NULL;

-- 1.2 Make availability_overrides.product_id nullable to allow global overrides
-- (It might already be nullable based on FK definition, but ensure it)
ALTER TABLE availability_overrides ALTER COLUMN product_id DROP NOT NULL;