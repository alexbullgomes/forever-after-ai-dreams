
# Revised Availability Backend Refactor Plan

## Summary

This plan refactors the availability system to use a day-capacity based model (1-2 sessions/day) as the single global source of truth. Key changes include fixing the SQL slot status logic, globalizing hold checks, and implementing a status-only override model.

---

## Key Changes from Previous Plan

| Aspect | Previous Plan | Revised Plan |
|--------|--------------|--------------|
| **Capacity Model** | `capacity_override = 1000` | Keep `daily_capacity = 2`, no capacity in overrides |
| **Override Purpose** | Mixed (status + capacity) | Status-only (limited/full/blocked/available) |
| **Hold Expiration** | Create limited with capacity=1000 | Create limited without capacity change |
| **Unlock Mechanism** | Not addressed | Delete limited override OR set to available |

---

## Phase 1: Fix SQL Slot Status Logic

**Problem:** The `get_global_slot_availability` function has a bug where slots with capacity=1 and 0 bookings are marked as "limited" instead of "available".

**Current buggy logic (line 103):**
```sql
ELSIF v_used = v_capacity - 1 THEN
  v_status := 'limited';
```

When capacity=2 and used=0: `0 = 2-1 = 1` → FALSE → works correctly
When capacity=1 and used=0: `0 = 1-1 = 0` → TRUE → WRONG!

**Fixed logic:**
```sql
-- Only mark as limited when capacity > 1 AND exactly 1 slot remains
ELSIF v_capacity > 1 AND v_capacity - v_used = 1 THEN
  v_status := 'limited';
```

This ensures:
- Capacity=1: Slot goes directly from "available" (0 used) to "full" (1 used)
- Capacity=2: Slot is "available" (0 used) → "limited" (1 used) → "full" (2 used)

---

## Phase 2: Update Global Rule to daily_capacity=2

**SQL Update:**
```sql
UPDATE availability_rules 
SET daily_capacity = 2
WHERE product_id IS NULL AND is_active = true;
```

This allows 2 sessions per day globally.

---

## Phase 3: Deactivate Legacy Per-Product Rules

**SQL Update:**
```sql
UPDATE availability_rules 
SET is_active = false 
WHERE product_id IS NOT NULL AND is_active = true;
```

This ensures only the global rule is active.

---

## Phase 4: Normalize Overrides to Status-Only

**Remove capacity_override from all existing overrides:**
```sql
UPDATE availability_overrides 
SET capacity_override = NULL
WHERE capacity_override IS NOT NULL;
```

**Rationale:** Capacity is managed by the global rule (`daily_capacity=2`). Overrides should only control status (limited/full/blocked/available).

---

## Phase 5: Globalize Hold Conflict Checks in Edge Function

**File:** `supabase/functions/create-booking-checkout/index.ts`

**Current Logic (lines 110-127):**
The function scopes hold checks by product_id or package_id, allowing conflicts across different products/packages.

**New Logic:**
```typescript
// Check for ANY active/converted hold on this date+time globally
let existingHoldQuery = supabase
  .from("booking_slot_holds")
  .select("id, status, expires_at")
  .eq("event_date", event_date)
  .eq("start_time", selected_time)
  .in("status", ["active", "converted"]);
// NO filtering by product_id or package_id - global check
```

This ensures a hold on any product/package blocks the same slot for all others.

---

## Phase 6: Fix BookingsPipeline Availability Computation

**File:** `src/pages/BookingsPipeline.tsx`

**Current Issue (lines 140-148):**
Campaign bookings with null `product_id` are incorrectly marked as "needs_review".

**Fix:**
```typescript
// Remove the product_id check - compute availability for ALL bookings
for (const booking of bookingList) {
  if (booking.selected_time) {
    // Compute global availability (no product_id check)
    const availability = await getSlotAvailability(slotStart, slotEnd);
    newMap[booking.id] = availability;
  } else {
    // No time selected yet
    newMap[booking.id] = {
      status: 'needs_review',
      reason: 'No time selected',
      ...
    };
  }
}
```

---

## Phase 7: Update Quick Presets to Status-Only

**File:** `src/hooks/useAvailabilityOverrides.ts`

**Current:** Presets set `capacity_override: dailyCapacity` for "available" days.

**Fix:** Set `capacity_override: null` for ALL presets - let the global rule handle capacity.

```typescript
// For available presets
newOverrides.push({
  product_id: null,
  date: dateStr,
  status: 'available',
  capacity_override: null,  // Status-only, no capacity override
  reason: 'Quick Preset: Weekday available',
  ...
});

// For limited presets
newOverrides.push({
  product_id: null,
  date: dateStr,
  status: 'limited',
  capacity_override: null,  // Status-only
  reason: 'Quick Preset: Extended weekend limited',
  ...
});
```

---

## Phase 8: Add "Unlock" Functionality

**Purpose:** When an admin wants to release a "limited" slot back to "available", they should be able to:
1. Delete the limited override (slot reverts to rule-based availability), OR
2. Set an "available" override

**Implementation:** The existing `AvailabilityOverrideModal` already supports both:
- Setting status to "available"
- Deleting an override

**Enhancement:** Add a "Reset to Default" button that deletes the override entirely:

```typescript
// In AvailabilityOverrideModal.tsx
<Button 
  variant="outline" 
  onClick={handleDelete}
>
  Reset to Default (Remove Override)
</Button>
```

---

## Phase 9: Ensure Stripe CTA Logic is Correct

**File:** `src/components/booking/BookingStepSlots.tsx`

**Current Logic (lines 127-135):**
```typescript
const isLimitedSlot = selectedSlotStatus === 'limited';
```

**Behavior:**
- `status === 'available'` → Shows "Hold my date & pay" (Stripe CTA)
- `status === 'limited'` → Shows "Check availability with our team" (Chat CTA)

**Verification:** This logic is correct. The fix in Phase 1 ensures that truly available slots are marked as "available", so the Stripe CTA will display correctly.

---

## Phase 10: Add Realtime Subscriptions

**Files:** `AvailabilityManager.tsx`, `BookingsPipeline.tsx`

**Pattern:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('availability-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'availability_overrides',
      filter: 'product_id=is.null'
    }, () => loadMonthAvailability())
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'bookings'
    }, () => loadMonthAvailability())
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'booking_slot_holds'
    }, () => loadMonthAvailability())
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

---

## Summary of Changes

### Database Migrations

| Change | SQL |
|--------|-----|
| Fix slot status logic | Update `get_global_slot_availability` function |
| Set global daily_capacity=2 | `UPDATE availability_rules SET daily_capacity = 2 WHERE product_id IS NULL` |
| Deactivate per-product rules | `UPDATE availability_rules SET is_active = false WHERE product_id IS NOT NULL` |
| Remove capacity from overrides | `UPDATE availability_overrides SET capacity_override = NULL` |

### Frontend Changes

| File | Change |
|------|--------|
| `BookingsPipeline.tsx` | Remove product_id check, add realtime subscription |
| `AvailabilityManager.tsx` | Add realtime subscription |
| `useAvailabilityOverrides.ts` | Set capacity_override = null in presets |
| `AvailabilityOverrideModal.tsx` | Add "Reset to Default" button |

### Edge Function Changes

| File | Change |
|------|--------|
| `create-booking-checkout/index.ts` | Remove product/package scoping in hold check |

---

## Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| Empty day (0/2 used) | Varies (bug) | "available" (Stripe CTA) |
| Day with 1/2 bookings | "limited" | "limited" (Chat CTA) |
| Day with 2/2 bookings | "full" | "full" (unavailable) |
| Expired hold | Creates limited override | Creates limited override (status-only) |
| Admin unlocks day | No clear path | Delete override OR set available |
| Hold on Product A | Only blocks Product A slot | Blocks slot for ALL products/packages |

---

## What Stays Unchanged

- Booking funnel flow and animations
- 15-minute hold duration
- Stripe webhook processing
- Chat CTA for limited slots
- Calendar color coding (green/yellow/gray)
- Hold expiration trigger (just removes capacity_override logic)
