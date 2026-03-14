

# "Talk to our team" Button — Implementation Plan

## What we're building

A secondary CTA button in the booking time selection step (BookingStepSlots) that lets users contact the team via chat instead of proceeding to payment. The button works even without a time slot selected.

## Architecture

This reuses the existing `everafter:open-chat-with-message` custom event system — no new infrastructure needed. The chat event listener in `expandable-chat-assistant.tsx` already handles opening the chat and auto-submitting a message.

For the auto-response (confirmation message + phone capture card), we'll extend the event payload to include a `followUp` flag. The chat listener will then insert the follow-up messages (a text message + a phone_capture card) into the database after the user's inquiry message.

## Changes

### 1. `src/components/booking/BookingStepSlots.tsx`

Add a new "Talk to our team about this package" button in the CTA section:

- Placed **above** the existing "Hold my date & pay" button in both the normal and limited-slot branches
- Styled as `variant="outline"` with a `MessageCircle` icon — visually secondary
- Always clickable (no `disabled` state — works with or without a selected time)
- On click: constructs a contextual message including product name + selected date (if any) + selected time (if any), then dispatches `everafter:open-chat-with-message` with a `followUp: true` flag, and closes the modal

Add a new prop `onContactTeam` to replace inline logic, or handle it internally by dispatching the event directly (simpler approach — avoids prop threading through BookingFunnelModal).

### 2. `src/components/ui/expandable-chat-assistant.tsx`

Extend the `everafter:open-chat-with-message` event handler to check for `followUp: true` in the event detail. When present, after inserting the user's message, insert two follow-up messages:

1. A text message (role: `assistant`): *"Great choice! Our team will contact you as soon as possible. Please share your phone number so we can reach you."*
2. A card message (role: `assistant`, type: `card`) with the existing `phone_capture` entity payload

Both follow-up messages are inserted into the `messages` table with the conversation's ID, ensuring they persist in chat history.

### 3. `src/components/ui/expandable-chat-webhook.tsx`

Same extension for the visitor (unauthenticated) chat handler — when `followUp: true`, insert the same follow-up text + phone capture card after the visitor's message.

## What stays untouched
- Booking slot holds, Stripe checkout, availability RPCs — zero changes
- BookingFunnelModal.tsx — no changes needed (the button dispatches the event directly from BookingStepSlots)
- PhoneCaptureCard component — reused as-is
- Existing limited-slot "Check availability" button — remains unchanged

## Message format

User message (auto-sent):
```
Hi! I'm interested in the [PRODUCT NAME] package for [DATE]. Can someone help me?
```
(If no date selected: omits the date portion)

Follow-up assistant text:
```
Great choice! Our team will contact you as soon as possible. Please share your phone number so we can reach you.
```

Follow-up phone capture card payload:
```json
{
  "entityType": "phone_capture",
  "entityId": "phone-capture-<timestamp>",
  "title": "Phone Number",
  "description": "Share your number so our team can reach you directly.",
  "ctaLabel": "Submit",
  "ctaUrl": "",
  "priceLabel": null,
  "imageUrl": null
}
```

## Files changed

| File | Change |
|------|--------|
| `src/components/booking/BookingStepSlots.tsx` | Add "Talk to our team" outline button above payment CTA |
| `src/components/ui/expandable-chat-assistant.tsx` | Handle `followUp` flag — insert assistant text + phone capture card |
| `src/components/ui/expandable-chat-webhook.tsx` | Same followUp handling for visitor chat |

