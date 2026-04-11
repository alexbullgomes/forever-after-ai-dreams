

# Fix: "Show Full Price" Toggle Not Respected

## Root Cause

Two issues identified:

1. **`CampaignProductsSection.tsx`** (campaign landing pages) passes `price={product.price}` directly without checking `show_full_price`. This means products on campaign pages always show the price regardless of the toggle.

2. **`ProductsSection.tsx`** already has the correct logic (`price={product.show_full_price ? product.price : undefined}`). If the Services page still shows the price, this may be a stale build from before the fix was deployed. After a fresh build, this component should work correctly.

## Changes

### File: `src/components/promo/CampaignProductsSection.tsx`
- Line 224: Change `price={product.price}` to `price={product.show_full_price ? product.price : undefined}`
- Line 226: Change `priceUnit={product.price_unit}` to `priceUnit={product.show_full_price ? product.price_unit : undefined}`

This is the only file that still passes the price unconditionally. No other rendering paths exist for the product cards.

## No Other Changes
- Database schema: already correct
- `ProductsSection.tsx`: already correct
- `3d-product-card.tsx`: already handles `price={undefined}` correctly (hides the price element entirely with no empty spacing)
- Booking/Stripe logic: untouched

