

# Implementation Plan: Three UI Updates to Booking Funnel

## 1. Button Label Change

**File**: `src/components/booking/BookingStepSlots.tsx` (line 305)
- Change `"Talk to our team about this package"` → `"Talk to our team"`
- Text-only change, no logic affected.

## 2. Close Modal After "Talk to our team" Click

**File**: `src/components/booking/BookingStepSlots.tsx`

The button currently dispatches the chat event but does not close the modal. The `handleChatAvailability` callback (for limited slots) already calls `onClose()` before triggering the chat — we need the same pattern here.

**Approach**: Add an `onClose` prop to `BookingStepSlots` and call it inside the button's `onClick` handler, right after dispatching the `everafter:open-chat-with-message` event. The parent `BookingFunnelModal` already passes `handleClose` to reset state and close the dialog.

- Add `onClose?: () => void` to `BookingStepSlotsProps`
- Pass `onClose={handleClose}` from `BookingFunnelModal` (line 358)
- Call `onClose?.()` after the `dispatchEvent` call (line 299)

## 3. Calendar Responsiveness

**File**: `src/components/booking/BookingStepSlots.tsx`

Current layout uses `grid md:grid-cols-2 gap-6` (line 175), which already stacks to single column on mobile. The modal is `sm:max-w-[600px]` with `overflow-y-auto`, so vertical scrolling is handled.

After inspecting the code, the responsive layout is already correct:
- `grid md:grid-cols-2` stacks on mobile, side-by-side on desktop
- Calendar and time slots both fit within the modal
- Buttons are full-width (`w-full`)
- ScrollArea handles time slot overflow

No changes needed for responsiveness — the existing implementation handles mobile correctly.

## Risk Assessment

- **Booking holds**: Untouched — hold creation is in `handleCheckout`
- **Availability checks**: Untouched — computed via `useAvailabilityComputation`
- **Checkout/Stripe flow**: Untouched — `onCheckout` callback unchanged
- **Auth gate**: Untouched — handled in `handleDateSubmit` and `handleCheckout`

## Files Modified

| File | Change |
|------|--------|
| `src/components/booking/BookingStepSlots.tsx` | Rename button label; add `onClose` prop; call it after chat dispatch |
| `src/components/booking/BookingFunnelModal.tsx` | Pass `onClose={handleClose}` to `BookingStepSlots` |

