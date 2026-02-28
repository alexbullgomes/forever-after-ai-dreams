

# Campaign Color Consistency -- Analysis Report & Refactor Plan

## Audit Results

### Components Using Theme Variables Correctly (No Changes Needed)
- **PromoHero** -- uses `bg-brand-gradient`, `text-brand-primary-from`, `hsl(var(--brand-primary-from))` throughout
- **CampaignPricingCard** -- uses `bg-brand-gradient`, `text-brand-primary-from`, `ring-[hsl(var(--brand-primary-from))]`, `bg-[hsl(var(--brand-primary-from)/0.1)]`
- **InteractiveProduct3DCard** -- uses `bg-brand-gradient`, `text-primary`, `border-primary`, semantic tokens only
- **EstimatedPriceBadge** -- uses `bg-brand-primary-from`
- **Contact** -- uses `bg-brand-gradient`, `bg-contact-bg-gradient`, `hsl(var(--brand-text-accent))`, all correct
- **CampaignProductsSection** -- uses semantic `text-foreground`, `text-muted-foreground`, `bg-muted/30`
- **CampaignVendorSection** -- uses semantic tokens only
- **PromotionalCampaignGallery** -- delegates to `InteractiveBentoGallery`, no color issues
- **PromotionalFooter** -- NOT rendered on campaign pages (only on Index.tsx), already uses `bg-brand-gradient`

### Components With Hardcoded Colors (2 Issues Found)

| File | Line | Hardcoded Value | Fix |
|------|------|----------------|-----|
| `src/components/promo/PromoPricing.tsx` | 21 | `from-rose-600 to-pink-600` on section heading | Replace with `bg-brand-gradient` (same pattern as PromoHero subheadline) |
| `src/pages/PromotionalLanding.tsx` | 150 | `from-rose-500 to-pink-500` and `from-rose-600 to-pink-600` on 404 error button | Replace with `bg-brand-gradient hover:bg-brand-gradient-hover` |

### GradientHeading (No Change Needed)
Uses hardcoded neutral gradients (`neutral-700`, `neutral-500`, etc.) intentionally for text readability -- these are structural/typographic, not brand colors.

## Footer Analysis

The `PromotionalFooter` is **only rendered on the homepage** (`Index.tsx`). It is **not present** on `/promo/:slug` pages. No footer changes are needed for campaign color scoping.

## Refactor Plan

Only **2 lines** need changing across **2 files**:

### 1. `src/components/promo/PromoPricing.tsx` (line 21)
Replace `bg-gradient-to-r from-rose-600 to-pink-600` with `bg-brand-gradient` on the heading.

### 2. `src/pages/PromotionalLanding.tsx` (line 150)
Replace hardcoded rose/pink gradient on the 404 button with `bg-brand-gradient hover:bg-brand-gradient-hover`.

## Impact Assessment
- Zero risk to global theme system
- Zero changes to `useSiteSettings`, `index.css`, `tailwind.config.ts`
- Zero changes to non-campaign pages
- All animations, transitions, and layouts preserved
- Scoped wrapper div approach remains unchanged

