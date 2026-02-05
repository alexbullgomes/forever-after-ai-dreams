
# Unified Global Availability Calendar Implementation Plan

## Problem Summary

The current system has **fragmented availability** because:

1. **SQL functions filter by `product_id`**: The `get_slot_availability()` and `get_day_availability()` functions only count bookings/holds matching a specific `product_id`
2. **Campaign packages use NULL product_id**: Campaign package bookings store `package_id` and `campaign_id` with `product_id = NULL`
3. **Result**: A hold on Feb 19 via Campaign Package doesn't show as blocked when viewing Product availability, and vice versa

**Screenshot observation**: The Availability Manager shows "0/0" for all days because it's querying per-product, and the selected product may not have matching rules or data.

---

## Solution Architecture

### Core Principle: Single Source of Truth

Create a **unified global availability resolver** that:
- Ignores `product_id` and `package_id` when counting bookings/holds
- Counts ALL confirmed bookings and active holds across the system
- Stores ONE global set of rules and overrides (using `product_id = NULL` convention)

### What Changes

| Component | Current State | New State |
|-----------|---------------|-----------|
| SQL `get_slot_availability()` | Filters by product_id | Counts ALL bookings/holds for date+time globally |
| SQL `get_day_availability()` | Filters by product_id | Uses global slot computation |
| `availability_rules` table | One rule per product | One global rule (product_id = NULL) |
| `availability_overrides` table | Scoped by product_id | Global overrides (product_id = NULL) |
| Admin UI dropdown | "Select a product" | Keep UI but always use global data |
| Booking modal calendar | Fetches per-product | Fetches global availability |

---

## Implementation Steps

### Phase 1: Database Changes

**1.1 Create Global Availability Functions**

Replace `get_slot_availability()` and `get_day_availability()` with versions that:

```sql
-- New function: get_global_slot_availability(p_slot_start, p_slot_end)
-- Counts ALL bookings + holds for the given time range, regardless of product/package

CREATE OR REPLACE FUNCTION get_global_slot_availability(
  p_slot_start timestamptz,
  p_slot_end timestamptz
) RETURNS jsonb AS $$
DECLARE
  v_date date;
  v_global_rules availability_rules%ROWTYPE;
  v_override availability_overrides%ROWTYPE;
  v_capacity integer;
  v_used integer;
  v_status text;
BEGIN
  -- Extract date from slot start
  v_date := (p_slot_start AT TIME ZONE 'America/Los_Angeles')::date;
  
  -- Get GLOBAL rules (product_id IS NULL)
  SELECT * INTO v_global_rules
  FROM availability_rules
  WHERE product_id IS NULL AND is_active = true
  LIMIT 1;
  
  -- If no global rules, fallback to default capacity
  IF v_global_rules.id IS NULL THEN
    v_capacity := 1; -- Default single booking per day
  ELSE
    v_capacity := v_global_rules.daily_capacity;
  END IF;
  
  -- Check for GLOBAL override (product_id IS NULL)
  SELECT * INTO v_override
  FROM availability_overrides
  WHERE product_id IS NULL AND date = v_date
  LIMIT 1;
  
  -- Apply override status if blocked/full/limited
  IF v_override.status = 'blocked' THEN
    RETURN jsonb_build_object('status', 'blocked', 'reason', v_override.reason);
  END IF;
  IF v_override.status = 'full' THEN
    RETURN jsonb_build_object('status', 'full', 'reason', v_override.reason);
  END IF;
  IF v_override.status = 'limited' THEN
    RETURN jsonb_build_object('status', 'limited', 'reason', v_override.reason);
  END IF;
  IF v_override.capacity_override IS NOT NULL THEN
    v_capacity := v_override.capacity_override;
  END IF;
  
  -- Count GLOBAL usage (all bookings + active holds for this date)
  SELECT COUNT(*) INTO v_used
  FROM (
    SELECT id FROM bookings
    WHERE event_date = v_date AND status IN ('confirmed', 'paid')
    UNION ALL
    SELECT id FROM booking_slot_holds
    WHERE event_date = v_date AND status = 'active' AND expires_at > now()
  ) combined;
  
  -- Determine status
  IF v_used >= v_capacity THEN
    v_status := 'full';
  ELSIF v_used = v_capacity - 1 THEN
    v_status := 'limited';
  ELSE
    v_status := 'available';
  END IF;
  
  RETURN jsonb_build_object(
    'status', v_status,
    'capacity', v_capacity,
    'used', v_used,
    'override_applied', (v_override.id IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**1.2 Update Hold Expiration Trigger**

The existing `handle_hold_expiration_to_limited()` trigger creates overrides with the hold's `product_id`. Update it to create **global overrides** (`product_id = NULL`):

```sql
-- Update trigger to create GLOBAL limited override
-- Change: product_id := NULL instead of NEW.product_id
```

**1.3 Create Global Rules Record**

Insert one global availability rule:

```sql
INSERT INTO availability_rules (
  product_id,  -- NULL for global
  timezone, workdays, start_time, end_time,
  slot_minutes, buffer_minutes, capacity_type,
  daily_capacity, slot_capacity, is_active
) VALUES (
  NULL,
  'America/Los_Angeles',
  ARRAY[0,1,2,3,4,5,6],
  '10:00', '18:00',
  60, 0, 'daily',
  1, 1, true
);
```

---

### Phase 2: Frontend Hook Changes

**2.1 Update `useAvailabilityComputation.ts`**

Change to call the new global functions:

```typescript
// Before:
const getSlotAvailability = async (productId: string | null, ...) => {
  await supabase.rpc('get_slot_availability', { p_product_id: productId, ... });
}

// After:
const getSlotAvailability = async (slotStart: Date, slotEnd: Date) => {
  // No productId parameter - global lookup
  await supabase.rpc('get_global_slot_availability', {
    p_slot_start: slotStart.toISOString(),
    p_slot_end: slotEnd.toISOString(),
  });
}
```

**2.2 Update `useAvailabilityRules.ts`**

Fetch global rules only (where `product_id IS NULL`):

```typescript
// Before:
query = query.eq('product_id', productId);

// After:
query = query.is('product_id', null); // Global rules only
```

**2.3 Update `useAvailabilityOverrides.ts`**

Create/fetch global overrides only:

```typescript
// Before:
.eq('product_id', productId)

// After:
.is('product_id', null) // Global overrides
```

---

### Phase 3: Admin UI Changes

**3.1 Update `AvailabilityManager.tsx`**

Keep the product dropdown for backwards compatibility, but **ignore it** when fetching data:

```typescript
// Keep UI as-is, but:
// - Remove dependency on selectedProductId for availability fetching
// - Call getMonthAvailability() without productId
// - Create global overrides with product_id = NULL
```

**3.2 Update `AvailabilityOverrideModal.tsx`**

Always save overrides with `product_id: null`:

```typescript
const overrideData = {
  product_id: null, // Always global
  status,
  ...
};
```

**3.3 Update `QuickPresetsPanel.tsx`**

Apply presets globally:

```typescript
// Before:
if (!productId) throw new Error('No product selected');

// After:
// Always apply to global (product_id = null)
```

---

### Phase 4: Booking Modal Changes

**4.1 Update `BookingStepSlots.tsx`**

Fetch global availability instead of per-product:

```typescript
// Before:
const result = await getMonthAvailability(productId, ...);

// After:
const result = await getGlobalMonthAvailability(...);
```

**4.2 Update `BookingFunnelModal.tsx`**

Already passes `productId` to child components, but BookingStepSlots will ignore it for availability checks.

---

### Phase 5: Edge Function Update

**5.1 Update `create-booking-checkout/index.ts`**

The hold creation already works globally because it doesn't filter by product for conflict checks. But ensure the hold expiration trigger creates global overrides.

---

## Data Migration

**Preserve existing data:**

```sql
-- Keep existing per-product overrides for history
-- They will be ignored by new global functions

-- Create global rule based on most common existing rules
INSERT INTO availability_rules (product_id, ...)
SELECT NULL, timezone, workdays, start_time, end_time, ...
FROM availability_rules
WHERE is_active = true
LIMIT 1;
```

---

## Success Criteria Verification

| Criterion | How It's Verified |
|-----------|-------------------|
| (a) BOOKED slot blocks all products/packages | Global `get_day_availability()` counts ALL bookings for date |
| (b) HOLD shows globally | Global function counts ALL active holds |
| (c) HOLD expiration → LIMITED globally | Trigger creates override with `product_id = NULL` |
| (d) LIMITED shows chat CTA | Existing `BookingStepSlots` logic already handles this |
| (e) Admin override blocks globally | Override saved with `product_id = NULL`, read by global function |

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/*.sql` | Create `get_global_slot_availability()`, `get_global_day_availability()`, update trigger, add global rule |
| `src/hooks/useAvailabilityComputation.ts` | Call global RPC functions, remove productId dependency |
| `src/hooks/useAvailabilityRules.ts` | Fetch global rules (product_id IS NULL) |
| `src/hooks/useAvailabilityOverrides.ts` | Fetch/create global overrides |
| `src/pages/AvailabilityManager.tsx` | Keep UI, use global data under the hood |
| `src/components/availability/AvailabilityOverrideModal.tsx` | Save with product_id = null |
| `src/components/availability/QuickPresetsPanel.tsx` | Apply globally |
| `src/components/booking/BookingStepSlots.tsx` | Fetch global availability |

---

## What Stays Unchanged

- Booking modal UX (steps, animations, CTAs)
- Campaign landing page appearance
- Chat integration for LIMITED slots
- Hold duration (15 minutes)
- Stripe checkout flow
- Existing confirmed bookings data
- Admin dashboard layout and navigation

---

## Backward Compatibility

- Existing per-product rules and overrides remain in database
- They are simply **not queried** by the new global functions
- If rollback needed, switch RPC calls back to per-product versions
