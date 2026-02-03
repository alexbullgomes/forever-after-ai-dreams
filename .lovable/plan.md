
# Booking Date Picker Bug Fix

## Problem Identified

The bug is in `src/components/booking/BookingStepDate.tsx` at lines 23-26:

```typescript
// Disable dates in the past and the next 2 days (minimum notice)
const disabledDays = {
  before: addDays(new Date(), 3),
};
```

**Root Cause**: The code intentionally adds 3 days as a "minimum notice" requirement, but this is not the expected behavior. The user should be able to select today and any future date.

**Current Behavior**:
- `addDays(new Date(), 3)` → February 5th (if today is Feb 2nd)
- `before: Feb 5th` → Disables Feb 2, 3, 4

**Expected Behavior**:
- Only dates strictly before today should be disabled
- Today and all future dates must be selectable

---

## Solution

Replace the `addDays(new Date(), 3)` logic with a proper "start of today" comparison that uses local date components (not UTC) to avoid timezone issues.

### Code Change

**File**: `src/components/booking/BookingStepDate.tsx`

**Before** (lines 23-26):
```typescript
// Disable dates in the past and the next 2 days (minimum notice)
const disabledDays = {
  before: addDays(new Date(), 3),
};
```

**After**:
```typescript
// Disable only past dates (before today)
// Use startOfDay to ensure proper comparison at midnight local time
import { startOfDay } from 'date-fns';

const disabledDays = {
  before: startOfDay(new Date()),
};
```

This change:
1. Uses `startOfDay(new Date())` to get today at 00:00:00 local time
2. The `before` property disables dates **before** today, meaning yesterday and earlier
3. Today (Feb 2nd) and all future dates remain selectable
4. Properly handles timezone by using local time (not UTC)

---

## Why This Works

| Date | Status |
|------|--------|
| February 1st | Disabled (before today) |
| February 2nd (today) | **Selectable** |
| February 3rd | **Selectable** |
| February 4th | **Selectable** |
| All future dates | **Selectable** |

---

## Timezone Considerations

The `startOfDay()` function from `date-fns` uses the local timezone by default. This ensures:
- "Today" is determined based on the user's local clock
- No UTC/local mismatch that could shift dates
- Consistent behavior regardless of user timezone

The product timezone (e.g., `America/Los_Angeles`) is already captured separately via `Intl.DateTimeFormat().resolvedOptions().timeZone` and passed to the backend for slot availability computation. The date picker itself should allow selection based on the user's local perspective of "today."

---

## Business Hours Note

The existing architecture correctly separates concerns:
- **BookingStepDate**: Allows selecting today and future dates (no business hours cutoff)
- **BookingStepSlots**: Shows available time slots based on real-time availability computation (where business hours rules apply)
- **Backend availability functions**: Enforce product-specific rules, overrides, and capacity

This fix does NOT affect time slot availability logic, which remains controlled by the `availability_rules` and `availability_overrides` tables.

---

## Implementation

Single file change in `src/components/booking/BookingStepDate.tsx`:
1. Add `startOfDay` to the `date-fns` import
2. Replace `addDays(new Date(), 3)` with `startOfDay(new Date())`
3. Update comment to reflect actual behavior

---

## Testing Checklist

1. Open booking modal → Verify today is selectable
2. Verify yesterday and earlier dates are disabled
3. Select today → Proceed to availability check
4. Select a future date → Proceed to availability check
5. Test across different timezones (if possible)
6. Test after midnight → "Today" updates correctly
