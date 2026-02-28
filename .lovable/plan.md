

# Campaign-Scoped Modal Theme Inheritance

## Problem
Four modal types render via Radix portal to `document.body`, escaping campaign CSS variables:
1. **BookingFunnelModal** (from `CampaignPricingCard` and `CampaignProductsSection`)
2. **PersonalizedConsultationForm** (from `CampaignPricingCard`)
3. **AuthModal** (from `CampaignPricingCard`, `CampaignProductsSection`, and `PromotionalLanding`)
4. **ConsultationPopup** (from quiz flow, not used on campaign pages -- no change needed)

## Approach: React Context for Portal Container

Instead of prop-drilling `portalContainer` through every component, create a lightweight context that provides the campaign container ref. Any modal can consume it to portal into the themed scope.

## Files to Create

### `src/contexts/CampaignPortalContext.tsx`
- Simple context providing `HTMLElement | null`
- `CampaignPortalProvider` component wrapping children
- `useCampaignPortal()` hook returning the container element

## Files to Modify

### `src/pages/PromotionalLanding.tsx`
- Wrap the campaign container div's children with `CampaignPortalProvider` using `campaignContainerRef`
- Remove direct `portalContainer` prop from `PromotionalPopup` (it will use context instead)
- Remove direct `portalContainer` prop passing -- all modals auto-inherit via context

### `src/components/booking/BookingFunnelModal.tsx`
- Import `useCampaignPortal`
- Pass container to `DialogContent` via the `container` prop

### `src/components/AuthModal.tsx`
- Import `useCampaignPortal`
- Pass container to `DialogContent`

### `src/components/PersonalizedConsultationForm.tsx`
- Import `useCampaignPortal`
- Pass container to `DialogContent`
- Also pass container to `PopoverContent` (the date picker calendar also portals)

### `src/components/PromotionalPopup.tsx`
- Replace explicit `portalContainer` prop with `useCampaignPortal()` hook
- Falls back to `undefined` (body portal) when not inside a campaign page -- backward compatible

## How It Works

```text
PromotionalLanding
  └─ <div ref={campaignContainerRef} style={campaignCSS}>
       └─ <CampaignPortalProvider container={campaignContainerRef}>
            ├─ PromoPricing
            │    └─ CampaignPricingCard
            │         ├─ BookingFunnelModal  → useCampaignPortal() → portals into themed div
            │         ├─ PersonalizedConsultationForm → same
            │         └─ AuthModal → same
            ├─ CampaignProductsSection
            │    ├─ BookingFunnelModal → same
            │    └─ AuthModal → same
            ├─ AuthModal (page-level) → same
            └─ PromotionalPopup → same
```

On non-campaign pages (homepage, services), the context returns `null` → modals portal to `document.body` as before.

## Backward Compatibility
- Non-campaign pages: no context provider → `useCampaignPortal()` returns `null` → default Radix portal behavior
- No global CSS changes
- No booking/Stripe/availability logic changes
- `PromotionalPopup.portalContainer` prop becomes optional/deprecated (context takes priority)

