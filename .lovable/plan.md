
# Revised Availability Backend Refactor Plan ✅ COMPLETED

## Summary

This plan refactors the availability system to use a day-capacity based model (2 sessions/day) as the single global source of truth. **All phases have been completed.**

---

## Key Changes from Previous Plan

| Aspect | Previous Plan | Revised Plan |
|--------|--------------|--------------|
| **Capacity Model** | `capacity_override = 1000` | Keep `daily_capacity = 2`, no capacity in overrides |
| **Override Purpose** | Mixed (status + capacity) | Status-only (limited/full/blocked/available) |
| **Hold Expiration** | Create limited with capacity=1000 | Create limited without capacity change |
| **Unlock Mechanism** | Not addressed | Delete limited override OR set to available |

---

## Phase 1: Fix SQL Slot Status Logic ✅
Fixed the `get_global_slot_availability` function. Limited status now only triggers when capacity > 1 AND exactly 1 slot remains.

---

## Phase 2: Update Global Rule to daily_capacity=2 ✅
Updated global availability_rules to daily_capacity=2.

---

## Phase 3: Deactivate Legacy Per-Product Rules ✅
All per-product availability_rules set to is_active=false.

---

## Phase 4: Normalize Overrides to Status-Only ✅
All availability_overrides now have capacity_override=NULL. Overrides control status only.

---

## Phase 5: Globalize Hold Conflict Checks in Edge Function ✅
Updated `create-booking-checkout` to check for holds globally without product/package scoping.

---

## Phase 6: Fix BookingsPipeline Availability Computation ✅
Removed product_id check so campaign bookings correctly compute global availability.

---

## Phase 7: Update Quick Presets to Status-Only ✅
Updated useAvailabilityOverrides.ts to set capacity_override=null for all presets.

---

## Phase 8: Add "Unlock" Functionality ✅
AvailabilityOverrideModal now has "Reset to Default" button that deletes the override.

---

## Phase 9: Stripe CTA Logic ✅ VERIFIED
BookingStepSlots.tsx correctly shows Stripe CTA for "available" and Chat CTA for "limited".

---

## Phase 10: Add Realtime Subscriptions ✅
Added Supabase realtime subscriptions to AvailabilityManager.tsx and BookingsPipeline.tsx.

---

## Completed Changes Summary

### Database ✅
- Fixed get_global_slot_availability function
- Set global daily_capacity=2
- Deactivated per-product rules
- Removed capacity from all overrides

### Frontend ✅
- BookingsPipeline.tsx: Removed product_id check, added realtime
- AvailabilityManager.tsx: Added realtime subscriptions
- useAvailabilityOverrides.ts: Status-only presets
- AvailabilityOverrideModal.tsx: "Reset to Default" button

### Edge Functions ✅
- create-booking-checkout/index.ts: Global hold checks

## Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| Empty day (0/2 used) | "available" (Stripe CTA) |
| Day with 1/2 bookings | "limited" (Chat CTA) |
| Day with 2/2 bookings | "full" (unavailable) |
| Expired hold | Creates limited override (status-only) |
| Admin unlocks day | Delete override via "Reset to Default" |
| Hold on Product A | Only blocks Product A slot | Blocks slot for ALL products/packages |
