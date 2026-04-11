

# Campaign-Level Price Visibility Override

## Summary
Add a `hide_product_prices_in_campaign` boolean column to `promotional_campaigns` and wire it through the admin UI and campaign product cards.

## Database Migration
```sql
ALTER TABLE public.promotional_campaigns
ADD COLUMN hide_product_prices_in_campaign boolean NOT NULL DEFAULT false;
```

## File Changes

### 1. `src/integrations/supabase/types.ts`
Add `hide_product_prices_in_campaign` to the `promotional_campaigns` Row/Insert/Update types.

### 2. `src/components/admin/CampaignProductsTab.tsx`
- Accept new prop: `hideProductPrices: boolean` and `onToggleHideProductPrices: (val: boolean) => void`
- Add a second toggle below "Enable Products Section": "Hide product prices in this campaign" with helper text

### 3. `src/components/admin/PromotionalCampaignForm.tsx`
- Add `hide_product_prices_in_campaign` to `formData` type, defaults, reset logic, and save payload
- Pass the new props to `CampaignProductsTab`

### 4. `src/pages/PromotionalLanding.tsx`
- Pass `hideProductPrices={campaign.hide_product_prices_in_campaign}` to `CampaignProductsSection`

### 5. `src/components/promo/CampaignProductsSection.tsx`
- Accept new prop `hideProductPrices?: boolean`
- Update price logic:
  ```typescript
  const shouldShowPrice = !hideProductPrices && product.show_full_price;
  price={shouldShowPrice ? product.price : undefined}
  priceUnit={shouldShowPrice ? product.price_unit : undefined}
  ```

## Scope
- Only affects campaign landing page product cards
- No changes to Services page, booking flow, Stripe, or admin product views

