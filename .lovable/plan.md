

# Fix: Campaign Theme Race Condition on First Paint

## Root Cause

Two issues cause the production-only flicker:

1. **Ref timing**: `CampaignPortalProvider` reads `container.current` during render. On first render the ref is `null` (not yet attached to DOM), so all modals fall back to `document.body` portal and inherit global `:root` colors instead of campaign colors.

2. **Inline styles don't cascade to body-portaled content**: Even if the portal eventually works, there's a window where modals could open before the ref resolves. Inline CSS variables on a wrapper div only apply to DOM descendants inside that div — not to elements portaled elsewhere.

## Solution

### 1. Apply campaign colors to `document.documentElement` via `useLayoutEffect` (`src/pages/PromotionalLanding.tsx`)

- When `campaign.brand_colors` is available, use `useLayoutEffect` to synchronously apply all campaign CSS variables directly to `document.documentElement.style` (same variables that `buildCampaignColorStyle` generates).
- This runs before browser paint, eliminating the flash.
- On unmount, remove those properties and let `useSiteSettings` re-apply global colors from localStorage cache (already handled by the inline script in `index.html` + the hook's `fetchColors`).
- Keep the existing inline `style` on the wrapper div as a belt-and-suspenders fallback.

### 2. Fix `CampaignPortalProvider` ref timing (`src/contexts/CampaignPortalContext.tsx`)

- Replace reading `container.current` during render with internal state + `useLayoutEffect` that updates state after DOM attachment.
- This ensures the context value is the actual DOM element, not `null`, for all children.

### 3. Create `applyCampaignColorsToRoot` / `removeCampaignColorsFromRoot` utilities (`src/utils/campaignColors.ts`)

- Extract the logic to apply/remove campaign CSS variables on `document.documentElement` into reusable functions alongside the existing `buildCampaignColorStyle`.

## Files Changed

1. **`src/utils/campaignColors.ts`** — Add `applyCampaignColorsToRoot()` and `removeCampaignColorsFromRoot()` functions
2. **`src/contexts/CampaignPortalContext.tsx`** — Fix ref timing with `useLayoutEffect` + state
3. **`src/pages/PromotionalLanding.tsx`** — Add `useLayoutEffect` to apply campaign colors to document root; cleanup on unmount

## No Changes To
- Global `useSiteSettings` hook or `site_settings` table
- `index.html` inline brand script
- Booking, Stripe, or availability logic
- Admin dashboard
- Any modal component internals (they already consume `useCampaignPortal`)

