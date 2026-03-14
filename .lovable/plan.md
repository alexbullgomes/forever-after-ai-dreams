

# Dynamic Status Message for Booking Time Selection

## Problem
The green "You're in luck" banner (lines 140-152) is hardcoded and never changes, even when the selected date is limited, full, or blocked.

## Solution
Replace the static banner with a derived status message based on `currentDayAvailability.status`, which is already computed on line 101 from the `monthAvailability` data.

### Single file change: `src/components/booking/BookingStepSlots.tsx`

**Derive the selected date's status:**
```typescript
const selectedDateStatus = currentDayAvailability?.status ?? 'available';
```

**Replace lines 139-152** with a conditional render:

| Status | Icon | Colors | Title | Subtitle |
|--------|------|--------|-------|----------|
| `available` | Sparkles (green) | green-50 bg, green border | "You're in luck — we can fit your date!" | "All time slots are available for your selected date." |
| `limited` | AlertCircle (amber) | amber-50 bg, amber border | "Limited availability on this date." | "Select a time or contact our team to confirm availability." |
| `full` / `blocked` | AlertCircle (red) | red-50 bg, red border | "Sorry, we may be fully booked on this date." | "Please contact our team to check possible availability." |

The component already has `currentDayAvailability` on line 101 — no new data fetching, hooks, or state needed. The message updates automatically when the user clicks a different date because `eventDate` changes, which updates the derived status.

### What stays untouched
- Calendar day coloring logic (modifiers)
- Time slot selection and rendering
- Checkout / hold / Stripe flow
- The separate "offer expired" amber warning (lines 154-162)
- All availability computation hooks and RPC calls

