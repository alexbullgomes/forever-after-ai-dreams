

# Promotional Price Display (UI-Only Enhancement)

## Summary
Add `has_promotional_price` and `promotional_price` columns to the `products` table, wire them through the admin form and product card component for display-only promotional pricing with strikethrough on the original price. No changes to Stripe, booking, or backend logic.

## Database Migration
```sql
ALTER TABLE public.products
ADD COLUMN has_promotional_price boolean NOT NULL DEFAULT false,
ADD COLUMN promotional_price numeric;
```

## File Changes

### 1. `src/integrations/supabase/types.ts`
Add `has_promotional_price` and `promotional_price` to products Row/Insert/Update types.

### 2. `src/hooks/useProducts.ts`
Add both fields to the Product interface and include them in all queries and the duplicate function.

### 3. `src/components/admin/ProductForm.tsx`
Below the existing "Booking Reserve Settings" section, add a new section:
- Toggle: "Enable promotional price"
- When enabled, show a numeric input for `promotional_price`
- Include in save payload

### 4. `src/components/ui/3d-product-card.tsx`
- Add optional props: `originalPrice?: number | string`, `isPromotional?: boolean`
- Update price rendering: when `isPromotional` is true, show `originalPrice` with strikethrough (muted, smaller) and the main `price` as the promotional price (highlighted)
- When not promotional, render price as before

### 5. `src/components/planner/ProductsSection.tsx`
Compute promotional display logic before passing to card:
```typescript
const showPromo = product.has_promotional_price 
  && product.promotional_price 
  && product.promotional_price < product.price;

price={product.show_full_price 
  ? (showPromo ? product.promotional_price : product.price) 
  : undefined}
originalPrice={product.show_full_price && showPromo ? product.price : undefined}
isPromotional={product.show_full_price && showPromo}
```

### 6. `src/components/promo/CampaignProductsSection.tsx`
Same logic as above, but also respecting `hideProductPrices` campaign override:
```typescript
const shouldShowPrice = !hideProductPrices && product.show_full_price;
const showPromo = shouldShowPrice 
  && product.has_promotional_price 
  && product.promotional_price 
  && product.promotional_price < product.price;
```

## Visual Design
Price area when promotional:
```text
$350  $249 Session
^^^^  ^^^^
muted  primary/bold
line-through
```
Both prices inline, same row. No "sale" labels.

## Scope
- Display only -- Stripe, booking, and reserve logic completely untouched
- `promotional_price` is never passed to checkout or edge functions
- Safe defaults: existing products unaffected

