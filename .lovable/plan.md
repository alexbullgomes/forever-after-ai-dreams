

## Date Shift Fix: Booking Pipeline to Override Modal

### Problem
When clicking the Availability badge for a booking with `event_date = "2026-02-26"`, the Override modal shows **Feb 25, 2026** instead of Feb 26.

**Root cause**: `new Date("2026-02-26")` interprets the YYYY-MM-DD string as **UTC midnight**. In America/Los_Angeles (PST/PDT, UTC-8/7), that becomes the **previous day** (Feb 25 at 4:00 PM).

### Locations to Fix

There are **2 instances** of this bug in `src/pages/BookingsPipeline.tsx`:

1. **Line 587** -- Date passed to Override modal:
   ```
   date={new Date(overrideModalBooking.event_date)}
   ```
   Fix: Parse as local date using split-based constructor.

2. **Line 176** -- Slot availability computation:
   ```
   const slotStart = new Date(booking.event_date);
   ```
   Fix: Same local date parsing.

### Fix Approach

Replace `new Date(dateString)` with local date parsing:
```typescript
const [y, m, d] = booking.event_date.split('-').map(Number);
new Date(y, m - 1, d)
```

This is the **exact same pattern** already used correctly on lines 371 and 483 of the same file for displaying the event date in the table and detail modal.

### Files Changed
- `src/pages/BookingsPipeline.tsx` (2 edits, lines 176 and 587)

### No Changes To
- Database schema, availability logic, booking logic, RLS, edge functions
- UI components, layout, or any other files

### Verification
After fix, clicking the Availability badge for a Feb 26 booking will open the Override modal showing "Feb 26, 2026" consistently.

