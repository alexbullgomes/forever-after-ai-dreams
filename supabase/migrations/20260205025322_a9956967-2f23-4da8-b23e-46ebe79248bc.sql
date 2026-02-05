-- Insert global availability rule if it doesn't exist
INSERT INTO availability_rules (
  product_id,
  timezone,
  workdays,
  start_time,
  end_time,
  slot_minutes,
  buffer_minutes,
  capacity_type,
  daily_capacity,
  slot_capacity,
  is_active
) 
SELECT 
  NULL,
  'America/Los_Angeles',
  ARRAY[0,1,2,3,4,5,6],
  '10:00',
  '18:00',
  60,
  0,
  'daily',
  1,
  1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM availability_rules WHERE product_id IS NULL AND is_active = true
);