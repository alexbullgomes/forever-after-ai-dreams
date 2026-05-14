# Promotional Footer Pricing Mismatch — Fix Plan

## Root cause

`src/components/PromotionalFooter.tsx` reads pricing exclusively from the **legacy** columns on `promotional_campaigns`:
- `pricing_card_1_title` / `pricing_card_1_price` / `pricing_card_1_enabled`
- `pricing_card_2_*`
- `pricing_card_3_*`

Meanwhile, the Edit Campaign modal's **Packages** tab (`CampaignPackagesTab` + `useCampaignPackages`) writes to a separate table, **`campaign_packages`** (fields `title`, `price_display`, `is_enabled`, `sort_order`, `is_popular`, `minimum_deposit_cents`, ...). This is the same source `usePromotionalCampaign` and `PromoPricing` already use on the campaign landing pages.

So the footer is reading from a stale legacy schema that the admin no longer edits, while the new Packages editor saves to `campaign_packages`. Hence the outdated $1500 / $3000 / $2000 values.

## Source of truth

`campaign_packages` table, filtered by `campaign_id`, `is_enabled = true`, ordered by `sort_order`. Use `title` and `price_display` for display. This matches the campaign landing page (`PromoPricing`) so the footer and the campaign page stay in sync.

## Files involved

- `src/components/PromotionalFooter.tsx` — only file that needs logic changes
- (Reference, no changes) `src/hooks/useCampaignPackages.ts`, `src/hooks/usePromotionalCampaign.ts`, `src/components/promo/PromoPricing.tsx`, `src/components/admin/CampaignPackagesTab.tsx`

## Database

- Read from: `public.campaign_packages` (existing, RLS already allows public read for enabled packages on active campaigns — confirmed by current usage on `/promo/:slug`)
- Keep reading from: `public.promotional_campaigns` for `slug`, `banner_headline`, `is_active`, `visibility_mode`, `promotional_footer_enabled`
- Legacy `pricing_card_1/2/3_*` columns: NOT removed. Kept as a safe fallback only when a campaign has zero enabled packages in `campaign_packages`.

## Implementation plan (single-file, low risk)

1. **Update fetch in `PromotionalFooter.tsx`**
   - Query `promotional_campaigns` for active + public + `promotional_footer_enabled` campaigns (keep current filters), select `id, slug, banner_headline` plus the legacy `pricing_card_*` columns (kept for fallback).
   - For the resulting campaign list, fetch related rows from `campaign_packages` in a single query: `.select('campaign_id,title,price_display,sort_order,is_enabled').in('campaign_id', ids).eq('is_enabled', true).order('sort_order')`.
   - Group packages by `campaign_id` in memory.

2. **Build display cards per campaign**
   - If campaign has ≥1 enabled package → map each to `{ title, price: price_display }` (cap at first 3 to preserve current footer layout).
   - Else → fall back to the legacy `pricing_card_1/2/3_*` fields (current behavior) so older campaigns that never used the new editor keep working.

3. **Realtime updates**
   - Keep the existing `postgres_changes` channel on `promotional_campaigns`.
   - Add a second channel on `campaign_packages` (`event: '*'`) that re-runs the same fetch, so admin edits to packages reflect on the homepage live.
   - Clean up both channels on unmount.

4. **No UI changes**
   - JSX, classes, rotation logic, mobile/chat-open hide behavior, keyboard handlers, navigation to `/promo/:slug` all unchanged.

## Risks & mitigations

- **Risk:** A campaign has the footer enabled but no packages in `campaign_packages` yet → would render empty.
  **Mitigation:** Legacy `pricing_card_*` fallback preserved.
- **Risk:** RLS on `campaign_packages` blocks anonymous read.
  **Mitigation:** Already publicly readable — `usePromotionalCampaign` performs the same anonymous query for `/promo/:slug` and works in production.
- **Risk:** N+1 query if many active campaigns.
  **Mitigation:** Single `.in('campaign_id', ids)` batch query.
- **No impact on:** Stripe checkout, booking holds, deposits (`minimum_deposit_cents` untouched), campaign visibility toggles, package ordering, campaign landing pages, AI/n8n flows, realtime chat.

## Out of scope (explicitly not changed)

- Booking / deposit / Stripe logic
- Footer design and animation
- Legacy `pricing_card_*` columns (kept; can be deprecated in a later migration once all campaigns are confirmed migrated)
- Admin Packages editor