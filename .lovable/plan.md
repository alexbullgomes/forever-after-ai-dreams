

# Booking Reserve Pricing System

## Summary
Add three new columns to the `products` table (`booking_reserve_enabled`, `booking_reserve_amount`, `show_full_price`) and update the admin form, booking flow, and product cards to support a per-product deposit/reserve amount for Stripe checkout.

## Database Migration

Add three columns to `products`:
```sql
ALTER TABLE products ADD COLUMN booking_reserve_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN booking_reserve_amount numeric DEFAULT null;
ALTER TABLE products ADD COLUMN show_full_price boolean NOT NULL DEFAULT true;
```

- `booking_reserve_amount` stores the reserve price in the same unit as `price` (dollars, not cents) for consistency with the existing `price` column.
- All existing products default to `booking_reserve_enabled = false` and `show_full_price = true`, preserving current behavior with zero regression.

## File Changes

### 1. `src/integrations/supabase/types.ts`
Add the three new fields to the `products` Row/Insert/Update types.

### 2. `src/hooks/useProducts.ts`
Add the three new fields to the `Product` interface.

### 3. `src/components/admin/ProductForm.tsx`
Add a new "Booking Reserve Settings" section (bordered box, similar to the Highlight section):
- **Toggle**: `booking_reserve_enabled` -- "Enable booking reserve deposit"
- **Input** (shown when enabled): `booking_reserve_amount` -- number field labeled "Reserve Amount ($)"
- **Toggle**: `show_full_price` -- "Show full price on product cards"

Add these to the zod schema and form reset logic.

### 4. `src/components/booking/BookingFunnelModal.tsx`
Update `productPrice` prop usage:
- When passing price to `create-booking-checkout`, check if `bookingProduct.booking_reserve_enabled && bookingProduct.booking_reserve_amount`:
  - If yes: pass `booking_reserve_amount` as `product_price`
  - If no: pass `price` as before

This requires the callers to pass the full product object or the reserve fields.

### 5. Callers of BookingFunnelModal (4 files)
Update `ProductsSection`, `CampaignProductsSection`, chat components to pass the effective checkout price:
```typescript
productPrice={
  bookingProduct.booking_reserve_enabled && bookingProduct.booking_reserve_amount
    ? bookingProduct.booking_reserve_amount
    : bookingProduct.price
}
```

### 6. `src/components/booking/BookingStepSlots.tsx`
Update the booking summary display:
- If reserve is enabled, show "Reserve today for $X" instead of just the price
- Optionally show "Total package: $Y" if `show_full_price` is true

Add two new optional props: `isReserveMode?: boolean` and `fullPrice?: number`.

### 7. `src/components/ui/3d-product-card.tsx` (product card display)
No structural change needed -- the `price` prop is already flexible. The caller (`ProductsSection`) will conditionally hide the price based on `show_full_price`.

### 8. `src/components/planner/ProductsSection.tsx`
Conditionally pass price to the 3D card:
- If `show_full_price` is false, pass an empty string or custom label
- Pass effective checkout price to BookingFunnelModal

### 9. Edge Function: `create-booking-checkout`
No changes needed. The frontend already sends `product_price` dynamically. The edge function uses whatever `product_price` it receives. The `amount_paid` in the webhook will correctly reflect the charged amount.

### 10. Stripe Webhook / processBookingPayment
No changes needed. `amount_paid` is already set from `session.amount_total`, which will be the reserve amount when applicable.

## Data Flow

```text
Admin sets: price=$800, booking_reserve_enabled=true, booking_reserve_amount=$150

Frontend:
  Card shows: $800 (if show_full_price=true) or hidden
  BookingFunnelModal receives: productPrice=$150
  BookingStepSlots shows: "Reserve today for $150" + "Total package: $800"

Edge Function:
  Receives product_price=150 → Stripe charges $150

Webhook:
  amount_paid = 15000 (cents) → stored as-is
  Original price ($800) remains in products table untouched
```

## Non-Breaking Guarantees
- New columns have safe defaults; existing products work unchanged
- No existing column modifications
- No webhook/edge function changes
- No RLS changes
- `price` field remains the source of truth for total package value
- Campaign booking flow completely unaffected (uses `minimumDepositCents`)

