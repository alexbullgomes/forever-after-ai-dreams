

# Campaign Package CTA Button Customization

## Overview

Add admin-controlled visibility and label customization for both CTA buttons on campaign pricing cards, with full backward compatibility.

## Changes

### 1. Database Migration

Add 4 nullable columns to `campaign_packages`:

```sql
ALTER TABLE campaign_packages
  ADD COLUMN primary_cta_text text,
  ADD COLUMN primary_cta_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN secondary_cta_text text,
  ADD COLUMN secondary_cta_enabled boolean NOT NULL DEFAULT true;
```

Existing rows get `true` for both enabled fields (default), `null` for text fields (triggers frontend fallback to current labels).

### 2. Hook Update (`src/hooks/useCampaignPackages.ts`)

Add the 4 new fields to `CampaignPackage`, `CreatePackageData`, and `UpdatePackageData` interfaces. No query changes needed since we `select('*')`.

### 3. Campaign Hook (`src/hooks/usePromotionalCampaign.ts`)

Add the 4 fields to the package mapping (they come through automatically via `select('*')`, just need type coverage).

### 4. Admin Form (`src/components/admin/CampaignPackagesTab.tsx`)

Add to `PackageFormData` interface and `defaultPackageData`:
- `primary_cta_text: ''`, `primary_cta_enabled: true`
- `secondary_cta_text: ''`, `secondary_cta_enabled: true`

Add a "CTA Settings" section at the bottom of `renderPackageForm` (before the Save/Cancel buttons):
- **Primary Button**: Toggle (enabled/disabled) + text input (placeholder: "Secure Your Booking")
- **Secondary Button**: Toggle (enabled/disabled) + text input (placeholder: "Free Consultation First")

Update `startEditing` to populate CTA fields from package data. Update `handleCreatePackage` and `handleUpdatePackage` to pass CTA fields.

### 5. Frontend Card (`src/components/promo/CampaignPricingCard.tsx`)

Add 4 optional props: `primaryCtaText`, `primaryCtaEnabled`, `secondaryCtaText`, `secondaryCtaEnabled`.

Conditionally render buttons:
- Primary: render only if `primaryCtaEnabled !== false`. Label = `primaryCtaText || 'Secure Your Booking'`
- Secondary: render only if `secondaryCtaEnabled !== false`. Label = `secondaryCtaText || 'Free Consultation First'`

No changes to `onClick` handlers or modal logic.

### 6. Props Pass-through (`src/components/promo/PromoPricing.tsx`)

Pass the 4 new fields from `pkg` to `CampaignPricingCard`.

## Files Modified

| File | Change |
|------|--------|
| Migration | Add 4 columns to `campaign_packages` |
| `src/hooks/useCampaignPackages.ts` | Add fields to interfaces |
| `src/hooks/usePromotionalCampaign.ts` | Add fields to type mapping |
| `src/components/admin/CampaignPackagesTab.tsx` | Add CTA Settings section in form |
| `src/components/promo/CampaignPricingCard.tsx` | Conditional render + custom labels |
| `src/components/promo/PromoPricing.tsx` | Pass CTA props |

## Safety

- All new columns have safe defaults — existing packages render identically
- No changes to booking flow, Stripe, or modal triggers
- `onClick` handlers untouched — only button visibility and label text affected
- Null text = use hardcoded default label (backward compatible)

