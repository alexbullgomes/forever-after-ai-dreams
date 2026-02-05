

# Decoupling Marketing Price from Booking Hold Price

## Current State Analysis

After reviewing the codebase, I found that the refactoring to `campaign_packages` table is **partially complete**:

| Component | Status | Uses |
|-----------|--------|------|
| Database: `campaign_packages` table | ✅ Created | Has `price_display` (marketing) + `minimum_deposit_cents` (booking) |
| Frontend: `CampaignPricingCard` | ✅ Working | Uses both values correctly |
| Frontend: `PromoPricing` | ✅ Working | Fetches from `campaign_packages` |
| Frontend: Booking Modal | ✅ Working | Uses `minimumDepositCents` for price display |
| Edge Function: `create-booking-checkout` | ✅ Working | Uses `minimum_deposit_cents` for Stripe |
| Admin UI: `PromotionalCampaignForm` | ❌ Legacy | Still uses `pricing_card_*` columns |

**The Critical Gap**: The Admin Dashboard still edits the **legacy** `pricing_card_*` columns on the `promotional_campaigns` table, but the frontend now reads from the `campaign_packages` table. This means:
1. Changes made in Admin don't affect what users see
2. Admins cannot edit the `minimum_deposit_cents` field
3. The system is in a broken state for campaign management

---

## What Needs to Change

### No Changes Required

| Component | Reason |
|-----------|--------|
| Campaign Page Cards | Already uses `price_display` (marketing) from packages |
| Booking Modal | Already uses `minimumDepositCents` (booking hold price) |
| Edge Functions | Already uses `minimum_deposit_cents` for Stripe |
| `useCampaignPackages` hook | Already has full CRUD operations |
| `usePromotionalCampaign` hook | Already fetches packages |

### Changes Required

| Component | Change |
|-----------|--------|
| Admin "Pricing" Tab | Completely replace with "Packages" manager |
| Tab Label | Rename "Pricing" → "Packages" |
| Package Editor | Add "Minimum booking value" field |

---

## Implementation Plan

### Phase 1: Create Packages Tab Component

**New File: `src/components/admin/CampaignPackagesTab.tsx`**

A dedicated component for managing campaign packages with:

```text
┌─────────────────────────────────────────────────────────────┐
│  Packages                                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Toggle: Show Promotional Packages Section]        │   │
│  │  Toggle to show or hide the entire pricing section  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Existing Packages:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Brand Photography Content                    [Edit]│   │
│  │  Marketing: "Starting at $250" | Hold: $150         │   │
│  │  ☆ Popular  ✓ Enabled                      [Delete]│   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Brand Content Package                        [Edit]│   │
│  │  Marketing: "Personalize" | Hold: $200              │   │
│  │  ★ Popular  ✓ Enabled                      [Delete]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ + Add New Package ]                                      │
└─────────────────────────────────────────────────────────────┘
```

**Package Editor Fields:**

| Field | Type | Purpose |
|-------|------|---------|
| Title | text | Package name (e.g., "Brand Photography Content") |
| Marketing Price | text | Display value (e.g., "Starting at $250", "Personalize") |
| Description | textarea | Package description |
| Features | array | List of features |
| Ideal For | text | Optional ideal customer text |
| Is Popular | switch | Show "Most Popular" badge |
| Is Enabled | switch | Show/hide package |
| **Minimum Booking Value** | number | **NEW** - Amount in USD for booking hold |

### Phase 2: Update Admin Form

**File: `src/components/admin/PromotionalCampaignForm.tsx`**

Changes:
1. Rename tab from "Pricing" to "Packages"
2. Replace entire pricing card section with `<CampaignPackagesTab />`
3. Keep `pricing_section_enabled` toggle (master visibility)

```diff
  <TabsList className="grid w-full grid-cols-8">
    <TabsTrigger value="basic">Basic</TabsTrigger>
    <TabsTrigger value="banner">Banner</TabsTrigger>
-   <TabsTrigger value="pricing">Pricing</TabsTrigger>
+   <TabsTrigger value="packages">Packages</TabsTrigger>
    <TabsTrigger value="gallery" disabled={!campaign}>Gallery</TabsTrigger>
    ...
  </TabsList>

- <TabsContent value="pricing" className="space-y-6">
-   {/* Legacy pricing cards UI - 200+ lines */}
- </TabsContent>

+ <TabsContent value="packages" className="space-y-6">
+   <CampaignPackagesTab
+     campaignId={campaign?.id}
+     pricingSectionEnabled={formData.pricing_section_enabled}
+     onPricingSectionToggle={(enabled) =>
+       setFormData((prev) => ({ ...prev, pricing_section_enabled: enabled }))
+     }
+   />
+ </TabsContent>
```

---

## Component Details

### CampaignPackagesTab

**Props:**
```typescript
interface CampaignPackagesTabProps {
  campaignId: string | undefined;
  pricingSectionEnabled: boolean;
  onPricingSectionToggle: (enabled: boolean) => void;
}
```

**State Management:**
- Uses existing `useCampaignPackages(campaignId)` hook
- Inline editing with expandable cards
- No local state sync needed - mutations auto-refresh

**Package Card Editor:**
```tsx
<div className="border rounded-lg p-4 space-y-4">
  {/* Header with toggle */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <GripVertical className="text-muted-foreground" />
      <span className="font-semibold">{pkg.title}</span>
      {pkg.is_popular && <Badge>Popular</Badge>}
    </div>
    <div className="flex items-center gap-2">
      <Switch checked={pkg.is_enabled} onChange={...} />
      <Button variant="ghost" onClick={() => setExpandedId(pkg.id)}>
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  </div>

  {/* Summary when collapsed */}
  {expandedId !== pkg.id && (
    <div className="flex gap-4 text-sm text-muted-foreground">
      <span>Marketing: {pkg.price_display}</span>
      <span>|</span>
      <span>Hold: ${pkg.minimum_deposit_cents / 100}</span>
    </div>
  )}

  {/* Full editor when expanded */}
  {expandedId === pkg.id && (
    <div className="space-y-4 pt-4 border-t">
      <Input label="Title" value={pkg.title} ... />
      <Input label="Marketing Price (display)" value={pkg.price_display} ... />
      
      {/* NEW FIELD - highlighted with help text */}
      <div className="space-y-2 p-3 bg-muted/50 rounded-lg border-2 border-primary/20">
        <Label className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Minimum booking value to secure date *
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
          <Input
            type="number"
            min="1"
            step="1"
            className="pl-7"
            value={pkg.minimum_deposit_cents / 100}
            onChange={(e) => handleUpdate({ minimum_deposit_cents: parseFloat(e.target.value) * 100 })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          This is the amount charged via Stripe to hold the booking date.
          It appears in the booking modal and is independent of the marketing price.
        </p>
      </div>

      <Textarea label="Description" ... />
      {/* Features list editor */}
      {/* Ideal For input */}
      {/* Popular toggle */}
      
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={() => handleDelete(pkg.id)}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
        <Button onClick={() => setExpandedId(null)}>Done</Button>
      </div>
    </div>
  )}
</div>
```

---

## Validation Rules

### Admin-Side Validation

1. **Minimum deposit required**: When `is_enabled = true`, `minimum_deposit_cents` must be ≥ 100 (≥ $1)
2. **Title required**: Cannot be empty
3. **Marketing price required**: Cannot be empty (but can be any text like "Personalize")

```typescript
const validatePackage = (pkg: CampaignPackage): string[] => {
  const errors: string[] = [];
  if (!pkg.title.trim()) errors.push('Title is required');
  if (!pkg.price_display.trim()) errors.push('Marketing price is required');
  if (pkg.is_enabled && (!pkg.minimum_deposit_cents || pkg.minimum_deposit_cents < 100)) {
    errors.push('Enabled packages must have a minimum booking value of at least $1');
  }
  return errors;
};
```

### Edge Function Validation (Already Exists)

```typescript
// In create-booking-checkout (already implemented)
if (campaign_mode && (!minimum_deposit_cents || minimum_deposit_cents < 100)) {
  return new Response(
    JSON.stringify({ error: "Package deposit not configured. Please contact support." }),
    { status: 400 }
  );
}
```

---

## Data Flow Summary

```text
Admin Dashboard
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  CampaignPackagesTab                                    │
│  • Edits campaign_packages table directly               │
│  • Sets price_display (marketing)                       │
│  • Sets minimum_deposit_cents (booking hold)            │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  campaign_packages table                                │
│  ┌────────────────┬────────────────────────────────┐   │
│  │ price_display  │ "Starting at $250"             │   │
│  │                │ (Marketing - display only)     │   │
│  ├────────────────┼────────────────────────────────┤   │
│  │ minimum_       │ 15000 ($150)                   │   │
│  │ deposit_cents  │ (Booking hold - functional)    │   │
│  └────────────────┴────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
     │
     ├─────────────────────────────────────────┐
     ▼                                         ▼
┌───────────────────────┐        ┌───────────────────────┐
│  Campaign Page        │        │  Booking Modal        │
│  • Displays           │        │  • Uses               │
│    price_display      │        │    minimum_deposit    │
│    ("Starting at $X") │        │    _cents for         │
│  • Marketing only     │        │    Stripe charge      │
└───────────────────────┘        └───────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/CampaignPackagesTab.tsx` | **CREATE** | New packages management component |
| `src/components/admin/PromotionalCampaignForm.tsx` | **MODIFY** | Replace pricing tab with packages tab |

### No Changes to These Files (Already Correct)

- `src/hooks/useCampaignPackages.ts` - Already has full CRUD
- `src/components/promo/CampaignPricingCard.tsx` - Already uses both prices correctly
- `src/components/promo/PromoPricing.tsx` - Already fetches from packages table
- `src/components/booking/BookingFunnelModal.tsx` - Already passes deposit cents
- `src/components/booking/BookingStepSlots.tsx` - Already displays booking price
- `supabase/functions/create-booking-checkout/index.ts` - Already uses deposit cents
- `supabase/functions/stripe-webhook/index.ts` - Already handles package bookings

---

## Migration & Backward Compatibility

### Existing Data

The migration script that created `campaign_packages` already copied data from legacy `pricing_card_*` columns. All existing campaigns should have packages with:
- `minimum_deposit_cents = 15000` (default $150)
- `price_display` from legacy `pricing_card_X_price`

### Legacy Columns

The legacy `pricing_card_*` columns on `promotional_campaigns` table can remain for now but will be ignored:
- Frontend reads from `campaign_packages` table
- Admin will now edit `campaign_packages` table

### No Breaking Changes

- Campaign pages will continue working (already using packages)
- Booking flow will continue working (already using deposit cents)
- Only the admin editing experience changes

---

## Testing Checklist

| Test Case | Expected Result |
|-----------|-----------------|
| Admin opens campaign with existing packages | Packages load in Packages tab |
| Admin edits marketing price | Card displays updated price on campaign page |
| Admin edits minimum booking value | Booking modal and Stripe use updated amount |
| Admin sets different values for marketing vs booking | Both display correctly in their contexts |
| Admin enables package without booking value | Validation error shown |
| User books package | Stripe charges the minimum booking value, not marketing price |
| User sees campaign page | Cards show marketing price with "Estimated Price" badge |
| User opens booking modal | Summary shows minimum booking value |

