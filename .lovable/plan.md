

# End-to-End Booking Flow Audit & Data Consistency Fix

## Executive Summary

This audit identified several root causes for the "Needs Review" status appearing incorrectly in the Bookings Pipeline and the lack of proper post-hold downgrade behavior. The issues stem from:

1. **Zero global overrides exist** - All 116 overrides are product-specific (`product_id IS NOT NULL`) while the system expects global overrides (`product_id IS NULL`)
2. **Hold expiration trigger not firing properly** - The trigger exists but expired holds have no corresponding global LIMITED overrides
3. **Calendar showing "Needs Review" due to missing global overrides** - The global availability functions can't find any matching overrides

---

## Root Cause Analysis

### Issue 1: "Needs Review" in Bookings Pipeline and Calendar

**Location**: `src/pages/BookingsPipeline.tsx` (lines 168-196), SQL function `get_global_slot_availability`

**Symptoms**: 
- All calendar days show "Needs Review" (orange indicator) as seen in the uploaded screenshot
- Pipeline availability badges show "Needs Review" for valid bookings

**Root Cause**:
The global availability functions query `availability_overrides WHERE product_id IS NULL`, but:
- Current database has **0 global overrides** and **116 product-specific overrides**
- The hold expiration trigger was updated to create global overrides, but existing overrides were never migrated
- The Quick Presets panel was recently refactored to use global overrides but legacy product-specific overrides still exist

**Evidence**:
```sql
-- Query results show:
-- global_overrides: 0
-- product_overrides: 116
```

### Issue 2: Post-Hold Downgrade Not Working

**Location**: Database trigger `handle_hold_expiration_to_limited`, `booking_slot_holds` table

**Symptoms**:
- 3 expired holds exist (dates 2026-02-14, 2026-02-19, 2026-02-08)
- No global LIMITED overrides exist for these dates
- Days revert to AVAILABLE instead of LIMITED after hold expiration

**Root Cause**:
The trigger function correctly targets global overrides (`product_id IS NULL`), but:
1. The trigger may not fire if holds are not transitioning via UPDATE (e.g., direct status set)
2. No UPSERT mechanism exists - multiple overrides per date could be created (but aren't due to global check)

### Issue 3: Legacy Product-Specific Data Blocking Global System

**Location**: `availability_overrides`, `availability_rules` tables

**Symptoms**:
- AvailabilityManager shows global rules exist and are active
- But the calendar shows "0/0" for all days and "Needs Review" status

**Root Cause**:
- The global rule exists: `daily_capacity = 2`, `product_id = NULL`, `is_active = true`
- But all 116 existing overrides have `product_id` set to specific products
- The realtime subscription filters for `product_id=is.null` so legacy overrides are ignored

---

## Implementation Plan

### Phase 1: Database Migration - Clean Up Legacy Data

**Goal**: Migrate legacy product-specific overrides to global overrides and clean up duplicates

**SQL Migration**:
```sql
-- 1. Delete ALL product-specific overrides (they're superseded by global model)
DELETE FROM availability_overrides WHERE product_id IS NOT NULL;

-- 2. Create global LIMITED overrides for dates with expired holds (single override per date)
INSERT INTO availability_overrides (product_id, date, status, reason, created_by)
SELECT DISTINCT
  NULL, -- Global override
  event_date,
  'limited',
  'Expired hold - requires team review',
  NULL
FROM booking_slot_holds
WHERE status = 'expired'
ON CONFLICT DO NOTHING; -- Prevent duplicates if run multiple times
```

### Phase 2: Fix Hold Expiration Trigger - Implement UPSERT

**Goal**: Ensure exactly ONE global override per date, using UPSERT instead of INSERT

**File**: Database function `handle_hold_expiration_to_limited`

**Change**: Replace INSERT with INSERT ... ON CONFLICT (UPSERT pattern)

```sql
CREATE OR REPLACE FUNCTION public.handle_hold_expiration_to_limited()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'expired' AND OLD.status = 'active' THEN
    -- UPSERT: Create or update global override for this date
    INSERT INTO availability_overrides (
      product_id,
      date,
      status,
      reason,
      created_by
    ) VALUES (
      NULL,
      NEW.event_date,
      'limited',
      'Expired hold - requires team review',
      NULL
    )
    ON CONFLICT (product_id, date) 
    WHERE product_id IS NULL
    DO UPDATE SET
      status = CASE 
        WHEN availability_overrides.status = 'available' THEN 'limited'
        ELSE availability_overrides.status -- Keep existing if already limited/full/blocked
      END,
      reason = CASE 
        WHEN availability_overrides.status = 'available' THEN 'Expired hold - requires team review'
        ELSE availability_overrides.reason
      END;
  END IF;
  
  RETURN NEW;
END;
$$;
```

**Note**: This requires adding a partial unique constraint for global overrides:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_overrides_global_date 
ON availability_overrides (date) 
WHERE product_id IS NULL AND date IS NOT NULL;
```

### Phase 3: Fix BookingsPipeline Display for Package Bookings

**Goal**: Ensure package bookings display correct name/value (already working per code review)

**File**: `src/pages/BookingsPipeline.tsx`

**Current Status**: ✅ Already handles both types correctly:
- Product bookings: `booking.products?.title` and `booking.products?.price`
- Package bookings: `booking.campaign_packages?.title` and `booking.campaign_packages?.minimum_deposit_cents / 100`

**Verification Query**:
```sql
-- The existing join logic is correct:
SELECT 
  br.*,
  p.title as product_title, p.price as product_price,
  cp.title as package_title, cp.minimum_deposit_cents
FROM booking_requests br
LEFT JOIN products p ON br.product_id = p.id
LEFT JOIN campaign_packages cp ON br.package_id = cp.id
```

### Phase 4: Ensure Global Availability Counts Both Booking Types

**Goal**: Verify bookings table counts all types in capacity calculation

**Current Status**: ✅ Already working correctly in SQL function `get_global_slot_availability`:
```sql
SELECT COUNT(*) INTO v_used
FROM (
  SELECT id FROM bookings
  WHERE event_date = v_date AND status IN ('confirmed', 'paid')
  -- No product_id filter = counts ALL bookings globally
  UNION ALL
  SELECT id FROM booking_slot_holds
  WHERE event_date = v_date AND status = 'active' AND expires_at > now()
  -- No product_id filter = counts ALL holds globally
) combined;
```

---

## Technical Details

### Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/migrations/XXXXXX.sql` | Create | Migration to clean up legacy overrides and create unique constraint |

### Database Changes

| Change | Purpose |
|--------|---------|
| Delete 116 product-specific overrides | Clean slate for global model |
| Create unique partial index on `(date) WHERE product_id IS NULL` | Enable UPSERT pattern |
| Update `handle_hold_expiration_to_limited` trigger | UPSERT instead of INSERT |
| Create LIMITED overrides for existing expired holds | Backfill missing data |

### No Frontend Changes Required

The frontend code is already correctly implemented:
- `BookingsPipeline.tsx`: Correctly joins products and campaign_packages tables
- `AvailabilityManager.tsx`: Correctly uses global overrides (`product_id IS NULL`)
- `useAvailabilityOverrides.ts`: Correctly creates global overrides
- `BookingFunnelModal.tsx`: Correctly passes package_id for campaign bookings

---

## Verification Steps

### Test 1: Product Booking Flow
1. Navigate to /services
2. Click "Reserve" on a product
3. Select a date and time
4. Proceed to checkout
5. Verify: Pipeline shows product name and price
6. Verify: Calendar reflects the hold in capacity

### Test 2: Package/Campaign Booking Flow
1. Navigate to /promo/[campaign-slug]
2. Click "Secure Your Booking" on a pricing card
3. Select a date and time
4. Proceed to checkout
5. Verify: Pipeline shows package title and minimum deposit
6. Verify: Calendar reflects the hold in capacity

### Test 3: Post-Hold Downgrade
1. Create a hold on an available date
2. Wait for 15-minute expiration (or manually expire via database)
3. Verify: Date changes from AVAILABLE to LIMITED
4. Verify: Only ONE global override exists for that date
5. Verify: User modal shows LIMITED status, Chat CTA instead of Stripe CTA

### Test 4: Admin Unlock
1. In Availability Manager, click on a LIMITED date
2. Either delete the override (Reset to Default) or set to AVAILABLE
3. Verify: Calendar reflects the change immediately
4. Verify: User modal shows AVAILABLE status, Stripe CTA available

---

## Expected Results After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Calendar days | "Needs Review" (orange) | Green/Yellow/Gray based on actual capacity |
| Product booking in Pipeline | Shows correctly | No change needed |
| Package booking in Pipeline | "Needs Review" | Shows package name + deposit amount |
| Expired hold | Day stays AVAILABLE | Day becomes LIMITED |
| Multiple expired holds same date | Could create duplicates | Single override (UPSERT) |
| Capacity counting | Global | No change (already global) |

