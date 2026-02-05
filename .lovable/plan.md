
# Global Availability Cleanup and Bug Fix Plan

**STATUS: ✅ COMPLETED**

## Summary

This plan addresses four main tasks:
1. Fix the booking modal bug where "available" slots show "Check availability with our team" instead of "Hold my date & pay"
2. Remove the product selector dropdown from Availability Manager
3. Clean up legacy per-product availability code/UI
4. Ensure availability is a single global source of truth

---

## Root Cause Analysis

**The Booking Modal Bug:**
The SQL function `get_global_slot_availability` has a logic error in determining slot status:

```text
Current Logic (BUGGY):
IF v_used = v_capacity - 1 THEN v_status := 'limited'

When capacity=1 and used=0:
- Condition: 0 = 1-1 = 0 (TRUE!)
- Result: Slot marked as "limited" even though it's completely available
```

This causes ALL slots to show as "limited" when daily_capacity=1, triggering the "Check availability with our team" CTA instead of "Hold my date & pay".

**Correct Logic:**
A slot should be "limited" when there's only 1 remaining slot AND capacity > 1, meaning:
- `v_capacity - v_used = 1 AND v_capacity > 1`

---

## Implementation Steps

### Phase 1: Fix SQL Slot Status Logic

**Update `get_global_slot_availability` function:**

```text
Before:
  ELSIF v_used = v_capacity - 1 THEN
    v_status := 'limited'

After:
  ELSIF v_capacity > 1 AND v_capacity - v_used = 1 THEN
    v_status := 'limited'
  -- When capacity=1, go directly from available to full
```

This ensures:
- When capacity=1: Slot is "available" (0 used) or "full" (1 used)
- When capacity>1: Slot is "limited" only when exactly 1 spot remains

---

### Phase 2: Clean Up Availability Manager UI

**Remove Product Selector:**

| Element | Action |
|---------|--------|
| Product dropdown (`<Select>`) | Remove entirely |
| `selectedProductId` state | Remove |
| `useProducts()` hook usage | Remove |
| Conditional rendering on `selectedProductId` | Remove conditions |

**Simplify Data Fetching:**
- Remove dependency on `selectedProductId` for loading availability
- Call `loadMonthAvailability()` directly on mount and month change
- Keep passing dummy or empty productId to child components for compatibility

---

### Phase 3: Clean Up Hook Signatures

**`useAvailabilityRules.ts`:**
- Remove `productId` parameter (already fetches global rules)
- Keep interface clean

**`useAvailabilityOverrides.ts`:**
- Remove `productId` parameter (already fetches global overrides)
- Keep interface clean

**`QuickPresetsPanel.tsx`:**
- Remove `productId` prop requirement
- Component already uses global operations

**`AvailabilityOverrideModal.tsx`:**
- Remove `productId` prop requirement
- Already saves with `product_id: null`

---

### Phase 4: Update Child Components

**Components to update:**

1. **QuickPresetsPanel**: Remove `productId` prop, update interface
2. **AvailabilityOverrideModal**: Remove `productId` prop, update interface
3. **AvailabilityManager**: Remove product-related state and UI

---

## Technical Details

### SQL Migration

```sql
-- Fix the limited status logic in get_global_slot_availability
-- When capacity=1, there's no "limited" state - it's either available or full

CREATE OR REPLACE FUNCTION public.get_global_slot_availability(...)
-- Change line 115 from:
--   ELSIF v_used = v_capacity - 1 THEN
-- To:
--   ELSIF v_capacity > 1 AND v_capacity - v_used = 1 THEN
```

### File Changes Summary

| File | Changes |
|------|---------|
| `supabase/migrations/...sql` | Fix SQL function logic for slot status |
| `src/pages/AvailabilityManager.tsx` | Remove product selector dropdown, clean up state |
| `src/hooks/useAvailabilityRules.ts` | Remove unused `productId` parameter |
| `src/hooks/useAvailabilityOverrides.ts` | Remove unused `productId` parameter |
| `src/components/availability/QuickPresetsPanel.tsx` | Remove `productId` prop |
| `src/components/availability/AvailabilityOverrideModal.tsx` | Remove `productId` prop |

---

## Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| Slot with capacity=1, 0 bookings | "limited" (chat CTA) | "available" (Stripe CTA) |
| Slot with capacity=2, 1 booking | "limited" (chat CTA) | "limited" (chat CTA) |
| Slot with capacity=1, 1 booking | "full" | "full" |
| Admin UI product selector | Shows dropdown | No dropdown (global calendar) |

---

## What Stays Unchanged

- Booking modal flow and animations
- Calendar color coding (green/yellow/gray)
- Chat CTA for genuinely limited slots
- Quick presets functionality
- Override modal functionality
- Global availability as single source of truth

---

## Changes Made

1. **SQL Migration**: Fixed `get_global_slot_availability` function logic - now only marks slots as "limited" when `capacity > 1 AND remaining = 1`
2. **AvailabilityManager.tsx**: Removed product selector dropdown and per-product state
3. **useAvailabilityRules.ts**: Removed unused `productId` parameter
4. **useAvailabilityOverrides.ts**: Removed unused `productId` parameter
5. **QuickPresetsPanel.tsx**: Removed `productId` prop
6. **AvailabilityOverrideModal.tsx**: Removed `productId` prop
7. **BookingsPipeline.tsx**: Removed `productId` prop from override modal usage
