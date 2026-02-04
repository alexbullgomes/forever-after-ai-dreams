

# Campaign Packages Refactoring - Implementation Plan

## Executive Summary

This plan refactors the current campaign pricing card system from an indexed-based approach (card 0, 1, 2) to an explicit **Package model** with stable UUIDs, per-package configurable deposit amounts, and proper booking/hold scoping.

---

## Current State Analysis

### Current Data Model

```text
promotional_campaigns table:
├── pricing_card_1_enabled, pricing_card_1_title, pricing_card_1_price, ...
├── pricing_card_2_enabled, pricing_card_2_title, pricing_card_2_price, ...
└── pricing_card_3_enabled, pricing_card_3_title, pricing_card_3_price, ...
```

**Problems:**
1. No stable identifiers - uses array index (0, 1, 2)
2. Deposit amount hardcoded to $150 in edge function
3. Hold conflict check uses only `campaign_id`, not `card_index`
4. Reordering cards would break existing bookings referencing old indices

### Current Booking Flow Issues

1. `create-booking-checkout`: Hardcoded `$150 USD` for all campaign bookings
2. `stripe-webhook`: Passes `product_id: null` for campaigns, causing NOT NULL constraint violation
3. Hold check: `.eq('campaign_id', campaign_id)` without card differentiation

---

## Proposed Solution

### Phase 1: Database Schema Changes

#### 1.1 New Table: `campaign_packages`

```sql
CREATE TABLE public.campaign_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  
  -- Display/Content
  title TEXT NOT NULL,
  price_display TEXT NOT NULL,           -- e.g. "$250–$1200" (for display)
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,    -- Array of strings
  ideal_for TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  
  -- Booking Configuration (NEW)
  minimum_deposit_usd INTEGER NOT NULL,   -- In cents (e.g. 15000 = $150)
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_campaign_packages_campaign_id ON campaign_packages(campaign_id);

-- RLS policies
ALTER TABLE campaign_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON campaign_packages
  FOR SELECT USING (true);

CREATE POLICY "Admin full access" ON campaign_packages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

#### 1.2 Update Related Tables

**booking_requests:**
```sql
ALTER TABLE booking_requests 
  ADD COLUMN package_id UUID REFERENCES campaign_packages(id);

-- Drop obsolete column (after migration)
-- ALTER TABLE booking_requests DROP COLUMN campaign_card_index;
```

**booking_slot_holds:**
```sql
ALTER TABLE booking_slot_holds 
  ADD COLUMN package_id UUID REFERENCES campaign_packages(id);
```

**bookings:**
```sql
-- CRITICAL: Make product_id nullable for campaign bookings
ALTER TABLE bookings 
  ALTER COLUMN product_id DROP NOT NULL;

-- Add package reference
ALTER TABLE bookings 
  ADD COLUMN package_id UUID REFERENCES campaign_packages(id);
```

#### 1.3 Migration Script: Existing Cards to Packages

```sql
-- Migrate existing pricing cards to campaign_packages table
INSERT INTO campaign_packages (campaign_id, title, price_display, description, features, ideal_for, is_popular, is_enabled, minimum_deposit_usd, sort_order)
SELECT 
  id,
  COALESCE(pricing_card_1_title, 'Package 1'),
  COALESCE(pricing_card_1_price, '$150'),
  pricing_card_1_description,
  COALESCE(pricing_card_1_features, '[]'::jsonb),
  pricing_card_1_ideal_for,
  COALESCE(pricing_card_1_popular, false),
  COALESCE(pricing_card_1_enabled, false),
  15000,  -- Default $150 (in cents)
  0
FROM promotional_campaigns
WHERE pricing_card_1_enabled = true;

-- Repeat for cards 2 and 3 with sort_order 1 and 2
-- (Similar INSERT statements)
```

---

### Phase 2: Admin UI Changes

#### 2.1 Rename "Pricing" Tab to "Packages"

**File:** `src/components/admin/PromotionalCampaignForm.tsx`

```diff
- <TabsTrigger value="pricing">Pricing</TabsTrigger>
+ <TabsTrigger value="packages">Packages</TabsTrigger>
```

#### 2.2 Add Minimum Deposit Field Per Package

For each package card in the admin form, add:

```tsx
<div className="space-y-2">
  <Label htmlFor={`${prefix}_minimum_deposit`}>
    Minimum amount to secure booking (USD) *
  </Label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
    <Input
      id={`${prefix}_minimum_deposit`}
      type="number"
      min="1"
      step="1"
      required
      className="pl-7"
      value={formData[`${prefix}_minimum_deposit`] || 150}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        [`${prefix}_minimum_deposit`]: parseInt(e.target.value) || 150
      }))}
      placeholder="150"
    />
  </div>
  <p className="text-xs text-muted-foreground">
    This amount will be charged at checkout to secure the booking
  </p>
</div>
```

#### 2.3 Create Package Management Hook

**New File:** `src/hooks/useCampaignPackages.ts`

```typescript
export function useCampaignPackages(campaignId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['campaign-packages', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('campaign_packages')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });

  const createPackage = useMutation({/* ... */});
  const updatePackage = useMutation({/* ... */});
  const deletePackage = useMutation({/* ... */});
  const reorderPackages = useMutation({/* ... */});

  return { packages, isLoading, createPackage, updatePackage, deletePackage, reorderPackages };
}
```

---

### Phase 3: Frontend Component Updates

#### 3.1 Update CampaignPricingCard Props

**File:** `src/components/promo/CampaignPricingCard.tsx`

```diff
interface CampaignPricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
  idealFor?: string;
  campaignId: string;
  campaignSlug: string;
- cardIndex: number;
+ packageId: string;           // NEW: Stable UUID
+ minimumDepositCents: number; // NEW: Per-package deposit
}
```

#### 3.2 Update PromoPricing Component

**File:** `src/components/promo/PromoPricing.tsx`

Instead of passing `cardIndex`, pass `packageId` and `minimumDepositCents`:

```tsx
{packages.map((pkg) => (
  <CampaignPricingCard
    key={pkg.id}
    name={pkg.title}
    price={pkg.price_display}
    description={pkg.description}
    features={pkg.features}
    popular={pkg.is_popular}
    idealFor={pkg.ideal_for}
    campaignId={campaignId}
    campaignSlug={campaignSlug}
    packageId={pkg.id}
    minimumDepositCents={pkg.minimum_deposit_usd}
  />
))}
```

#### 3.3 Update BookingFunnelModal Props

**File:** `src/components/booking/BookingFunnelModal.tsx`

```diff
interface BookingFunnelModalProps {
  // ... existing props
- cardIndex?: number;
+ packageId?: string;           // Stable UUID
+ minimumDepositCents?: number; // Dynamic deposit amount
}
```

#### 3.4 Update useBookingRequest Hook

**File:** `src/hooks/useBookingRequest.ts`

Change `campaignData` interface:

```diff
interface CampaignData {
  campaignId: string;
- cardIndex: number;
+ packageId: string;
}
```

Update booking request creation to use `package_id` instead of `campaign_card_index`:

```typescript
if (campaignData) {
  newRequest.campaign_id = campaignData.campaignId;
  newRequest.package_id = campaignData.packageId;  // NEW
}
```

---

### Phase 4: Edge Function Updates

#### 4.1 Update `create-booking-checkout`

**File:** `supabase/functions/create-booking-checkout/index.ts`

**Changes:**

1. Accept `package_id` and `minimum_deposit_cents` in request body
2. Use dynamic deposit amount instead of hardcoded $150
3. Store `package_id` in hold and Stripe metadata
4. Update hold conflict check to include `package_id`

```typescript
const {
  // ... existing fields
  package_id,              // NEW: UUID from campaign_packages
  minimum_deposit_cents,   // NEW: Per-package deposit amount
} = body;

// Dynamic deposit (replaces hardcoded $150)
const chargeAmount = campaign_mode 
  ? minimum_deposit_cents / 100  // Convert cents to dollars
  : product_price;

// Validation: Block if no deposit configured
if (campaign_mode && (!minimum_deposit_cents || minimum_deposit_cents < 100)) {
  return new Response(
    JSON.stringify({ error: "Package deposit not configured. Please contact support." }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
  );
}

// Updated hold check: Include package_id for campaigns
if (campaign_mode) {
  const { data: existingHold } = await supabase
    .from("booking_slot_holds")
    .select("id, status, expires_at")
    .eq("campaign_id", campaign_id)
    .eq("package_id", package_id)  // NEW: Scope by package
    .eq("event_date", event_date)
    .eq("start_time", selected_time)
    .in("status", ["active", "converted"])
    .maybeSingle();
}

// Updated hold creation
const holdData = {
  // ... existing fields
  package_id: campaign_mode ? package_id : null,  // NEW
};

// Updated Stripe metadata
metadata: {
  // ... existing fields
  package_id: package_id || "",
  minimum_deposit_cents: minimum_deposit_cents?.toString() || "",
}
```

#### 4.2 Update `stripe-webhook`

**File:** `supabase/functions/stripe-webhook/index.ts`

**Changes:**

1. Extract `package_id` from metadata
2. Handle nullable `product_id` for campaign bookings
3. Include `package_id` in booking record

```typescript
const {
  // ... existing fields
  package_id,
} = metadata;

// Updated processBookingPayment params
await processBookingPayment({
  // ... existing fields
  package_id: campaign_mode === 'true' ? package_id : null,
});

// Updated booking insert (with nullable product_id)
const { data: booking, error: bookingError } = await supabase
  .from('bookings')
  .insert({
    booking_request_id,
    product_id: product_id || null,   // Now nullable
    package_id: package_id || null,   // NEW
    // ... other fields
  });
```

---

### Phase 5: Update Promotional Campaign Hook

#### 5.1 Fetch Packages with Campaign

**File:** `src/hooks/usePromotionalCampaign.ts`

Update to fetch packages from the new table:

```typescript
interface PromotionalCampaign {
  // ... existing fields
  packages: CampaignPackage[];  // NEW: Replace pricing_card_* fields
}

interface CampaignPackage {
  id: string;
  title: string;
  price_display: string;
  description: string | null;
  features: string[];
  ideal_for: string | null;
  is_popular: boolean;
  is_enabled: boolean;
  minimum_deposit_usd: number;  // In cents
  sort_order: number;
}

// Fetch packages alongside campaign
const { data: packagesData } = await supabase
  .from('campaign_packages')
  .select('*')
  .eq('campaign_id', data.id)
  .eq('is_enabled', true)
  .order('sort_order', { ascending: true });

const parsedData = {
  ...data,
  packages: packagesData || [],
};
```

---

### Phase 6: Validation & Error Surfacing

#### 6.1 Pre-Checkout Validation

In `BookingFunnelModal.handleCheckout()`:

```typescript
// Block checkout if deposit not configured
if (campaignMode && (!minimumDepositCents || minimumDepositCents < 100)) {
  toast({
    title: 'Configuration Error',
    description: 'This package does not have a minimum deposit configured. Please contact the admin.',
    variant: 'destructive',
  });
  return;
}
```

#### 6.2 Admin Form Validation

In `PromotionalCampaignForm` submit handler:

```typescript
// Validate each enabled package has a deposit > 0
const enabledPackages = packages.filter(p => p.is_enabled);
const invalidPackages = enabledPackages.filter(p => !p.minimum_deposit_usd || p.minimum_deposit_usd < 100);

if (invalidPackages.length > 0) {
  toast({
    title: 'Validation Error',
    description: 'All enabled packages must have a minimum deposit of at least $1',
    variant: 'destructive',
  });
  return;
}
```

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| **Database Migrations** | | |
| `create_campaign_packages_table.sql` | CREATE | New packages table |
| `alter_booking_tables.sql` | ALTER | Add package_id columns, make product_id nullable |
| `migrate_pricing_cards_to_packages.sql` | INSERT | Data migration |
| **Admin UI** | | |
| `src/hooks/useCampaignPackages.ts` | CREATE | CRUD hook for packages |
| `src/components/admin/PromotionalCampaignForm.tsx` | MODIFY | Rename tab, add deposit field |
| `src/components/admin/CampaignPackageCard.tsx` | CREATE | Package editor component |
| **Frontend Components** | | |
| `src/components/promo/CampaignPricingCard.tsx` | MODIFY | Use packageId, minimumDepositCents |
| `src/components/promo/PromoPricing.tsx` | MODIFY | Pass package data |
| `src/components/booking/BookingFunnelModal.tsx` | MODIFY | Accept packageId, minimumDepositCents |
| **Hooks** | | |
| `src/hooks/useBookingRequest.ts` | MODIFY | Use packageId instead of cardIndex |
| `src/hooks/usePromotionalCampaign.ts` | MODIFY | Fetch packages from new table |
| **Edge Functions** | | |
| `supabase/functions/create-booking-checkout/index.ts` | MODIFY | Dynamic deposit, package_id scope |
| `supabase/functions/stripe-webhook/index.ts` | MODIFY | Handle nullable product_id, package_id |
| **Types** | | |
| `src/integrations/supabase/types.ts` | REGENERATE | Add campaign_packages table types |
| `src/utils/bookingRedirect.ts` | MODIFY | Replace cardIndex with packageId |

---

## Migration Strategy

### Step 1: Database First
1. Create `campaign_packages` table
2. Add `package_id` columns to booking tables
3. Make `bookings.product_id` nullable
4. Run migration to copy existing pricing cards to packages

### Step 2: Backend Functions
1. Update `create-booking-checkout` to support both old and new formats
2. Update `stripe-webhook` to handle nullable product_id
3. Deploy edge functions

### Step 3: Frontend Migration
1. Update hooks to fetch from new table
2. Update components to pass packageId
3. Update admin form to manage packages

### Step 4: Cleanup (After Verification)
1. Remove legacy `pricing_card_*` columns from `promotional_campaigns`
2. Remove `campaign_card_index` column from `booking_requests`

---

## Backward Compatibility

During migration:
- Edge functions accept both `card_index` (legacy) and `package_id` (new)
- Frontend checks for packages; falls back to pricing_card_* fields if empty
- Existing bookings with `campaign_card_index` remain valid

---

## Testing Checklist

| Test Case | Expected Behavior |
|-----------|-------------------|
| Admin: Create campaign with 2 packages, different deposits | Both deposits saved correctly |
| Admin: Set $0 deposit on package | Validation error shown |
| User: Book package with $200 deposit | Stripe charges $200 |
| User: Book different packages same campaign same slot | Both bookings proceed (no conflict) |
| User: Complete payment | Booking created with package_id, null product_id |
| Stripe webhook: Process campaign payment | No NOT NULL constraint error |
| Hold system: Two users same package same slot | Second user blocked |
| Hold system: Two users different packages same slot | Both allowed |

---

## Risk Mitigation

1. **Data Loss Prevention**: Pricing cards migrated before removal
2. **Downtime Prevention**: Backward-compatible edge functions
3. **Rollback Plan**: Keep legacy columns until fully verified
4. **Monitoring**: Add logging for campaign bookings in stripe-webhook

