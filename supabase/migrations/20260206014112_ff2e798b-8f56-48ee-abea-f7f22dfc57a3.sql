-- Clean up remaining product-specific overrides (legacy data from before global model)
DELETE FROM availability_overrides WHERE product_id IS NOT NULL;