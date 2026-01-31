

# Vendor Section Implementation Plan

## Executive Summary

This plan adds a new **Vendor Section** to the bottom of Promotional Campaign landing pages (`/promo/:slug`). The section displays vendor/partner logos using an animated carousel component and is fully manageable from the Admin Campaign Editor.

**Key Design Decisions:**
- Create a separate `campaign_vendors` table (following the existing pattern of `promotional_campaign_gallery` and `promotional_campaign_products`)
- Add minimal fields to `promotional_campaigns` for section configuration (enabled, headline, description)
- Follow existing admin patterns with a new "Vendors" tab in the Campaign Editor
- Section disabled by default for backward compatibility

---

## Architecture Analysis

### Current Campaign Section Pattern

The codebase follows a consistent pattern for optional campaign sections:

| Section | Enable Flag | Related Table | Hook | Frontend Component |
|---------|-------------|---------------|------|-------------------|
| Pricing | `pricing_section_enabled` | None (inline JSONB) | `usePromotionalCampaign` | `PromoPricing` |
| Products | `products_section_enabled` | `promotional_campaign_products` | `useCampaignProducts` | `CampaignProductsSection` |
| Gallery | N/A (renders if items exist) | `promotional_campaign_gallery` | `usePromotionalCampaignGallery` | `PromotionalCampaignGallery` |

**Vendor Section will follow the Products pattern:**
- Enable flag in `promotional_campaigns` table
- Separate `campaign_vendors` table for vendor data
- Dedicated hook for CRUD operations
- New frontend section component

### Current Page Layout (PromotionalLanding.tsx)

```text
1. Header
2. PromoHero
3. PromoPricing (conditional)
4. CampaignProductsSection (conditional)
5. PromotionalCampaignGallery
6. Contact
7. Chat
```

**New layout with Vendor Section:**

```text
1. Header
2. PromoHero
3. PromoPricing (conditional)
4. CampaignProductsSection (conditional)
5. PromotionalCampaignGallery
6. CampaignVendorSection (conditional) ← NEW (at END before Contact)
7. Contact
8. Chat
```

---

## Data Model

### Option A: Separate Table (Recommended)

This approach aligns with existing patterns and provides maximum flexibility.

**New Table: `campaign_vendors`**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | Primary key |
| `campaign_id` | uuid | NO | - | FK to promotional_campaigns |
| `name` | text | NO | - | Vendor display name |
| `logo_url` | text | YES | NULL | URL to vendor logo (SVG preferred) |
| `website_url` | text | YES | NULL | Optional link to vendor website |
| `sort_order` | integer | NO | 0 | Display order |
| `is_active` | boolean | NO | true | Visibility toggle |
| `created_at` | timestamptz | NO | now() | Creation timestamp |
| `updated_at` | timestamptz | NO | now() | Last update timestamp |

**Why separate table?**
- Unlimited vendors per campaign
- Easier ordering with drag-and-drop
- Future extensibility (categories, sponsorship levels, etc.)
- Consistent with existing `promotional_campaign_gallery` pattern
- Individual vendor visibility toggles
- Cleaner data model

**Extend `promotional_campaigns` table with:**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `vendors_section_enabled` | boolean | false | Master toggle |
| `vendors_section_headline` | text | 'Our Partners' | Section title |
| `vendors_section_description` | text | NULL | Optional subheadline |

### Database Migration SQL

```sql
-- Add vendor section configuration to promotional_campaigns
ALTER TABLE promotional_campaigns
ADD COLUMN IF NOT EXISTS vendors_section_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS vendors_section_headline text DEFAULT 'Our Partners',
ADD COLUMN IF NOT EXISTS vendors_section_description text;

-- Create campaign_vendors table
CREATE TABLE campaign_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  website_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_campaign_vendors_campaign_id ON campaign_vendors(campaign_id);
CREATE INDEX idx_campaign_vendors_sort_order ON campaign_vendors(campaign_id, sort_order);

-- Enable RLS
ALTER TABLE campaign_vendors ENABLE ROW LEVEL SECURITY;

-- Public read access for active vendors
CREATE POLICY "Anyone can view active vendors"
ON campaign_vendors FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage vendors"
ON campaign_vendors FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_vendors_updated_at
  BEFORE UPDATE ON campaign_vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE campaign_vendors IS 'Stores vendor/partner logos for promotional campaigns';
COMMENT ON COLUMN campaign_vendors.logo_url IS 'URL to vendor logo image (SVG preferred for scalability)';
COMMENT ON COLUMN promotional_campaigns.vendors_section_enabled IS 'Controls visibility of the Vendor Section on campaign landing pages';
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| **Database** | CREATE | Migration for `campaign_vendors` table + campaign columns |
| `src/integrations/supabase/types.ts` | AUTO-UPDATE | TypeScript types will regenerate |
| `src/components/ui/logo-carousel.tsx` | CREATE | LogoCarousel component (provided) |
| `src/components/ui/gradient-heading.tsx` | CREATE | GradientHeading component (provided) |
| `src/hooks/useCampaignVendors.ts` | CREATE | Hook for vendor CRUD operations |
| `src/components/promo/CampaignVendorSection.tsx` | CREATE | Frontend vendor section component |
| `src/components/admin/CampaignVendorsTab.tsx` | CREATE | Admin tab for vendor management |
| `src/hooks/usePromotionalCampaign.ts` | MODIFY | Add vendor section fields |
| `src/components/admin/PromotionalCampaignForm.tsx` | MODIFY | Add Vendors tab |
| `src/pages/PromotionalCampaigns.tsx` | MODIFY | Update Campaign interface |
| `src/pages/PromotionalLanding.tsx` | MODIFY | Render CampaignVendorSection |

---

## Implementation Details

### 1. UI Components (New Files)

**`src/components/ui/gradient-heading.tsx`**
- Copy the provided GradientHeading component
- Provides consistent heading styling with gradient variants

**`src/components/ui/logo-carousel.tsx`**
- Copy the provided LogoCarousel component
- Adapt for dynamic vendor logos (replace static SVG components with dynamic images)
- The component will need a small modification to accept image URLs instead of React components

**Modified LogoCarousel for URL-based logos:**

```tsx
interface Logo {
  name: string;
  id: number;
  logoUrl: string; // Changed from React component to URL
  websiteUrl?: string;
}

// LogoColumn updated to render img elements instead of React components
```

### 2. Data Hook

**`src/hooks/useCampaignVendors.ts`**

Following the pattern of `useCampaignProducts.ts`:

```typescript
export interface CampaignVendor {
  id: string;
  campaign_id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCampaignVendors(campaignId: string | undefined) {
  // State for vendors list
  // fetchVendors - query by campaign_id, order by sort_order
  // createVendor - insert new vendor
  // updateVendor - update vendor details
  // deleteVendor - remove vendor
  // reorderVendors - batch update sort_order
  // toggleActive - toggle is_active flag
}
```

### 3. Frontend Section Component

**`src/components/promo/CampaignVendorSection.tsx`**

Structure:
```tsx
<section className="py-16 px-4 bg-muted/30">
  <div className="container mx-auto max-w-7xl">
    {/* Headline */}
    <div className="text-center mb-12">
      <GradientHeading variant="secondary" size="lg">
        {headline}
      </GradientHeading>
      {description && (
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
    
    {/* Logo Carousel */}
    <LogoCarousel logos={vendors} columnCount={4} />
  </div>
</section>
```

Features:
- Fetches active vendors for the campaign
- Renders nothing if no active vendors
- Uses GradientHeading with `variant="secondary"` as specified
- Responsive layout matching existing sections

### 4. Admin Tab Component

**`src/components/admin/CampaignVendorsTab.tsx`**

Following the pattern of `CampaignProductsTab.tsx`:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Vendors Tab                                                      │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Enable Vendor Section                              [TOGGLE] │ │
│ │ Show vendor logos on the campaign landing page              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─ Section Text ───────────────────────────────────────────────┐│
│ │ Headline: [Our Partners                                    ] ││
│ │ Description: [Optional supporting text...                  ] ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─ Vendors ──────────────────────────────────── [+ Add Vendor] ┐│
│ │  ⋮⋮  [Logo] Vendor Name           [👁] [✏] [🗑]              ││
│ │  ⋮⋮  [Logo] Vendor Name           [👁] [✏] [🗑]              ││
│ │  ⋮⋮  [Logo] Vendor Name           [👁] [✏] [🗑]              ││
│ └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

Features:
- Master section toggle (mirrors Pricing/Products pattern)
- Headline and description text inputs
- Vendor list with drag-and-drop reordering (@dnd-kit)
- Each vendor shows: logo preview, name, visibility toggle, edit, delete
- Add Vendor modal with fields: name, logo URL, website URL

### 5. Updates to Existing Files

**`src/hooks/usePromotionalCampaign.ts`**

Add to interface:
```typescript
vendors_section_enabled: boolean;
vendors_section_headline: string | null;
vendors_section_description: string | null;
```

Update parsing:
```typescript
vendors_section_enabled: data.vendors_section_enabled ?? false,
vendors_section_headline: data.vendors_section_headline ?? 'Our Partners',
vendors_section_description: data.vendors_section_description ?? null,
```

**`src/components/admin/PromotionalCampaignForm.tsx`**

Changes:
1. Add to TabsList: `<TabsTrigger value="vendors" disabled={!campaign}>Vendors</TabsTrigger>`
2. Update grid-cols from 7 to 8
3. Add new TabsContent for vendors
4. Update Campaign interface with vendor fields
5. Update form state defaults

**`src/pages/PromotionalLanding.tsx`**

Add import and conditional render:
```tsx
import { CampaignVendorSection } from "@/components/promo/CampaignVendorSection";

// After PromotionalCampaignGallery, before Contact:
{campaign.vendors_section_enabled && (
  <CampaignVendorSection 
    campaignId={campaign.id}
    headline={campaign.vendors_section_headline || 'Our Partners'}
    description={campaign.vendors_section_description}
  />
)}
```

---

## Implementation Sequence

```text
Phase 1: Database & Types
├── 1.1 Create database migration
├── 1.2 TypeScript types will auto-regenerate

Phase 2: UI Components
├── 2.1 Create gradient-heading.tsx
├── 2.2 Create logo-carousel.tsx (adapted for URLs)

Phase 3: Data Layer
├── 3.1 Create useCampaignVendors.ts hook
├── 3.2 Update usePromotionalCampaign.ts

Phase 4: Admin UI
├── 4.1 Create CampaignVendorsTab.tsx
├── 4.2 Update PromotionalCampaignForm.tsx
├── 4.3 Update Campaign interface in PromotionalCampaigns.tsx

Phase 5: Frontend
├── 5.1 Create CampaignVendorSection.tsx
├── 5.2 Update PromotionalLanding.tsx
```

---

## Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing campaigns | Low | High | Default `vendors_section_enabled` to `false` |
| Tab overflow in admin form | Low | Low | Grid-cols-8 fits within modal width |
| Logo carousel performance | Medium | Medium | Limit vendor count or add pagination |
| RLS policy conflicts | Low | Medium | Follow existing policy patterns exactly |
| Image loading issues | Medium | Low | Add fallback/placeholder for missing logos |

### No Regressions Guarantee

1. **No schema changes to existing columns** - only adding new columns
2. **Default values preserve current behavior** - existing campaigns unaffected
3. **Conditional rendering** - section only renders when explicitly enabled
4. **Separate table** - vendor data isolated from existing campaign data
5. **Tab only enabled for saved campaigns** - matches Gallery/Products pattern

---

## Testing Checklist

1. **New campaigns**: Vendor section disabled by default
2. **Existing campaigns**: No change in appearance or behavior
3. **Toggle ON**: Vendor section appears at bottom of page
4. **Toggle OFF**: Vendor section hidden
5. **Add vendor**: Appears in list with drag handle
6. **Reorder vendors**: Drag-and-drop works, persists
7. **Edit vendor**: Name/logo/URL update correctly
8. **Delete vendor**: Removes from list
9. **Visibility toggle**: Individual vendor can be hidden
10. **Empty state**: Section hidden if no active vendors
11. **Headline/description**: Custom text displays correctly
12. **Mobile responsiveness**: Carousel adapts to screen width
13. **Logo animation**: Carousel cycles through vendors smoothly

---

## Technical Notes

### Logo Storage

Logos should be stored via external URLs (not base64 in database). Recommended approaches:
1. Supabase Storage bucket for uploaded logos
2. External CDN URLs for vendor logos
3. Direct links to vendor-provided logo assets

### LogoCarousel Adaptation

The provided LogoCarousel uses React component references for logos. For dynamic URL-based logos, the component will be adapted to render `<img>` elements instead:

```tsx
// Instead of: <CurrentLogo className="..." />
// Use: <img src={currentLogo.logoUrl} alt={currentLogo.name} className="..." />
```

This maintains the animation behavior while supporting dynamic content.

