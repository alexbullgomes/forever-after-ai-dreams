

# Fix: Duplicate Chat Messages & Button Visibility

## Issue 1 — Duplicate Messages

**Root cause**: Both chat components (authenticated and visitor) insert follow-up messages into the database AND manually add them to local state. The realtime subscription (postgres_changes in assistant, broadcast/polling in webhook) then picks up the same DB-inserted messages and adds them again → duplicates.

**Fix**: Remove the manual `setMessages` calls for follow-up messages in both files. The existing realtime/broadcast mechanisms will deliver them to the UI naturally.

### `src/components/ui/expandable-chat-assistant.tsx` (lines 613-631)
- Delete the `setMessages(prev => [...prev, ...])` block that manually adds the follow-up text and phone card after DB insertion
- The postgres_changes realtime subscription (lines 97-127) already catches all non-user message INSERTs and calls `addMessageToUI`

### `src/components/ui/expandable-chat-webhook.tsx` (lines 399-416)
- Delete the `setMessages(prev => [...prev, ...])` block that manually adds the follow-up text and phone card
- Broadcast and 7-second polling will deliver these messages

## Issue 2 — Button Visibility

**Current**: "Talk to our team" button is always visible (line 290-306), rendered unconditionally above both the limited and available CTA branches.

**Fix**: Wrap the button in `{!isLimitedSlot && (...)}` so it only shows when the selected slot is available. When limited, only "Check availability with our team" shows.

### `src/components/booking/BookingStepSlots.tsx`
- Line 290: Change from always-visible to `{!isLimitedSlot && (<Button ...>Talk to our team</Button>)}`

## Files changed

| File | Change |
|------|--------|
| `src/components/ui/expandable-chat-assistant.tsx` | Remove manual follow-up state additions (lines 613-631) |
| `src/components/ui/expandable-chat-webhook.tsx` | Remove manual follow-up state additions (lines 399-416) |
| `src/components/booking/BookingStepSlots.tsx` | Conditionally render "Talk to our team" only when `!isLimitedSlot` |

