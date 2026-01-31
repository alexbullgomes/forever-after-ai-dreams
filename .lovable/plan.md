

# Promotional Campaign Pricing Section Enhancement Plan

## Overview

This plan implements two changes to promotional campaign pages:
1. **Reorder sections** - Move the "Special Promotional Packages" (pricing cards) section to appear BEFORE Products and Gallery
2. **Add visibility toggle** - Allow admins to show/hide the entire pricing section via a new database field and admin toggle

## Current Section Order (PromotionalLanding.tsx)

```text
1. PromoHero
2. CampaignProductsSection (conditional)
3. PromotionalCampaignGallery
4. PromoPricing ← Currently last
5. Contact
```

## New Section Order

```text
1. PromoHero
2. PromoPricing ← Moved here (conditional on pricing_section_enabled)
3. CampaignProductsSection (conditional)
4. PromotionalCampaignGallery
5. Contact
```

---

## Database Change

### New Column

| Table | Column | Type | Default | Description |
|-------|--------|------|---------|-------------|
| `promotional_campaigns` | `pricing_section_enabled` | boolean | true | Controls visibility of the entire pricing section |

**Migration SQL:**
```sql
ALTER TABLE promotional_campaigns 
ADD COLUMN pricing_section_enabled boolean NOT NULL DEFAULT true;
```

**Why default is `true`:**
- Preserves current behavior for all existing campaigns
- Pricing cards will continue to display unless admin explicitly disables them

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| Database migration | CREATE | Add `pricing_section_enabled` column |
| `src/hooks/usePromotionalCampaign.ts` | MODIFY | Add `pricing_section_enabled` to interface and parsing |
| `src/components/admin/PromotionalCampaignForm.tsx` | MODIFY | Add master toggle at top of Pricing tab |
| `src/pages/PromotionalLanding.tsx` | MODIFY | Reorder sections and add conditional check |

---

## Detailed Implementation

### 1. Database Migration

Add new boolean column with safe default:

```sql
-- Add pricing_section_enabled to promotional_campaigns
ALTER TABLE promotional_campaigns 
ADD COLUMN IF NOT EXISTS pricing_section_enabled boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN promotional_campaigns.pricing_section_enabled IS 
  'Controls visibility of the Special Promotional Packages section on campaign landing pages';
```

### 2. Update usePromotionalCampaign.ts

Add `pricing_section_enabled` to the TypeScript interface:

```typescript
interface PromotionalCampaign {
  // ... existing fields
  products_section_enabled: boolean;
  pricing_section_enabled: boolean;  // NEW
}
```

Update the parsing logic to handle the new field:

```typescript
const parsedData = {
  ...data,
  tracking_scripts: (data.tracking_scripts as any) || [],
  products_section_enabled: data.products_section_enabled ?? false,
  pricing_section_enabled: data.pricing_section_enabled ?? true,  // NEW - default true
};
```

### 3. Update PromotionalCampaignForm.tsx

**Location:** At the top of the Pricing tab content (line 476)

**Add this before the pricing cards loop:**

```tsx
<TabsContent value="pricing" className="space-y-6">
  {/* NEW: Master section toggle */}
  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
    <div>
      <Label htmlFor="pricing_section_enabled" className="text-base font-medium">
        Show Promotional Packages Section
      </Label>
      <p className="text-sm text-muted-foreground mt-1">
        Toggle to show or hide the entire pricing section on the campaign page
      </p>
    </div>
    <Switch
      id="pricing_section_enabled"
      checked={formData.pricing_section_enabled}
      onCheckedChange={(checked) =>
        setFormData((prev) => ({ ...prev, pricing_section_enabled: checked }))
      }
    />
  </div>

  {/* Existing pricing cards - wrapped in conditional opacity */}
  <div className={formData.pricing_section_enabled ? '' : 'opacity-50 pointer-events-none'}>
    {[1, 2, 3].map((num) => {
      // ... existing card rendering
    })}
  </div>
</TabsContent>
```

**Also update the Campaign interface (line 36-73) to include:**

```typescript
interface Campaign {
  // ... existing fields
  products_section_enabled: boolean;
  pricing_section_enabled: boolean;  // NEW
}
```

**Update default form state (line 142-171):**

```typescript
const [formData, setFormData] = useState<Campaign>({
  // ... existing defaults
  products_section_enabled: false,
  pricing_section_enabled: true,  // NEW - default true
});
```

**Update the useEffect for loading existing campaign (line 269-277):**

```typescript
useEffect(() => {
  if (campaign) {
    setFormData({
      ...campaign,
      products_section_enabled: campaign.products_section_enabled ?? false,
      pricing_section_enabled: campaign.pricing_section_enabled ?? true,  // NEW
    });
    setTrackingScripts(campaign.tracking_scripts || []);
  }
}, [campaign]);
```

### 4. Update PromotionalLanding.tsx

**Reorder sections and add conditional rendering:**

Current (lines 232-253):
```tsx
<PromoHero ... />

{/* Products Section */}
{campaign.products_section_enabled && (
  <CampaignProductsSection campaignId={campaign.id} campaignSlug={slug!} />
)}

{/* Gallery Section */}
<PromotionalCampaignGallery campaignId={campaign.id} />

{/* Pricing Section - currently at bottom */}
<PromoPricing cards={pricingCards} campaignId={campaign.id} campaignSlug={campaign.slug} />

<Contact />
```

New order:
```tsx
<PromoHero ... />

{/* Pricing Section - MOVED HERE with conditional */}
{campaign.pricing_section_enabled && (
  <PromoPricing cards={pricingCards} campaignId={campaign.id} campaignSlug={campaign.slug} />
)}

{/* Products Section */}
{campaign.products_section_enabled && (
  <CampaignProductsSection campaignId={campaign.id} campaignSlug={slug!} />
)}

{/* Gallery Section */}
<PromotionalCampaignGallery campaignId={campaign.id} />

<Contact />
```

---

## Visual Reference - Admin Pricing Tab

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Pricing Tab                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Show Promotional Packages Section                              [TOGGLE]│ │
│ │ Toggle to show or hide the entire pricing section on the campaign page │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─ Card 1 ──────────────────────────────────────────────────────[TOGGLE]──┐ │
│ │ Brand Photography Content                                               │ │
│ │ Starting at $250                                                        │ │
│ │ ...                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─ Card 2 ──────────────────────────────────────────────────────[TOGGLE]──┐ │
│ │ ...                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ ┌─ Card 3 ──────────────────────────────────────────────────────[TOGGLE]──┐ │
│ │ ...                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Behavior Logic

| `pricing_section_enabled` | Card toggles | Result |
|--------------------------|--------------|--------|
| `true` | At least 1 enabled | Section displays with enabled cards |
| `true` | All disabled | Section hidden (existing `PromoPricing` logic) |
| `false` | Any | Section hidden entirely |

---

## Backward Compatibility

- Default value of `true` ensures all existing campaigns continue showing pricing cards
- No data migration needed
- Individual card toggles still work as before
- Only adds new control; does not remove any functionality

---

## What Remains Unchanged

- Database schema for individual pricing card fields
- PromoPricing component internal logic
- CampaignPricingCard component
- Products section behavior
- Gallery section behavior
- Mobile responsiveness (section ordering adapts)
- Visual styling (pink gradient, spacing, buttons)

---

## Testing Checklist

1. **New campaigns** - Pricing section enabled by default
2. **Existing campaigns** - Pricing section still visible after update
3. **Toggle OFF** - Pricing section disappears from landing page
4. **Toggle ON** - Pricing section reappears
5. **Section order** - Verify Pricing now appears before Products and Gallery
6. **Card combinations** - Test with 1, 2, and 3 cards enabled
7. **Mobile view** - Confirm responsive layout preserved

