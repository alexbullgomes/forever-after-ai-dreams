

# Phone Capture Chat Card — Implementation Plan

## Architecture Overview

The current chat system uses a `type` field on the `messages` table with a CHECK constraint supporting `'text' | 'audio' | 'card'`. Card messages store a JSON payload in `content` with an `entityType` discriminator (`'product' | 'campaign'`). The `ChatCardMessage` component renders these based on `entityType`. The `EntityPickerModal` in Chat Admin lets admins pick and send product/campaign cards.

## Design Decision: Extend existing `card` type, not a new `message.type`

Adding a new message type (e.g., `profile_phone_capture`) would require altering the DB CHECK constraint on `messages.type`. Instead, the safer approach is to add a **new `entityType` value** to the existing `CardMessageData` interface — specifically `'phone_capture'`. This:

- Requires zero database schema changes (the `content` JSON is already freeform)
- Follows the same pattern as product/campaign cards
- Keeps the `type = 'card'` message flow identical
- Only requires frontend rendering changes

## Implementation Plan

### 1. Extend `CardMessageData` type
**File: `src/types/chat.ts`**
- Add `'phone_capture'` to `entityType` union: `'product' | 'campaign' | 'phone_capture'`
- Add optional fields: `phoneCaptureMeta?: { status?: 'pending' | 'submitted'; submittedNumber?: string }`
- The card payload when sent by admin will look like:
```json
{
  "entityType": "phone_capture",
  "entityId": "phone-capture-<timestamp>",
  "title": "Phone Number Required",
  "description": "Please provide your phone number so we can reach you.",
  "priceLabel": null,
  "imageUrl": null,
  "ctaLabel": "Submit",
  "ctaUrl": ""
}
```

### 2. Create `PhoneCaptureCard` component
**New file: `src/components/chat/PhoneCaptureCard.tsx`**
- Renders a card visually consistent with `ChatCardMessage` (same padding, radius, border style)
- Contains the existing `PhoneNumberField` component (reuses dial code selector, US formatting)
- States: `pending` → `submitting` → `success` / `error`
- On submit: calls `supabase.from('profiles').update({ user_number: e164Phone }).eq('id', user.id)`
- RLS already allows users to update their own profile (confirmed from `GalleryConsultationForm` pattern)
- On success: shows green checkmark + formatted number, input becomes read-only
- If `user_number` already exists: pre-fill the field, show "Update" instead of "Submit"
- Card remains in chat history; re-renders as read-only with the saved number after success

### 3. Update message renderers (3 locations)
Add a branch for `entityType === 'phone_capture'` that renders `PhoneCaptureCard` instead of `ChatCardMessage`:

- **`src/components/ui/expandable-chat-assistant.tsx`** (~line 643): Add condition before `ChatCardMessage`
- **`src/components/dashboard/ChatAdmin.tsx`** (~line 724): Add condition before `ChatCardMessage`
- **`src/components/wedding/components/ChatMessage.tsx`** (~line 39): Add condition before `ChatCardMessage`

### 4. Add to "Send a Card" admin flow
**File: `src/components/chat/EntityPickerModal.tsx`**
- Add a third tab or a quick-action button: "Phone Capture" alongside Products and Campaigns
- When selected, no entity list needed — just a preview of the phone capture card
- On "Send Card", constructs the `phone_capture` `CardMessageData` payload and sends via the existing `onSendCard` callback

**File: `src/components/chat/QuickActionsButton.tsx`**
- Update tooltip to: "Send product, campaign, or action card"

### 5. Security
- The profile update uses the authenticated user's own `user.id` with `.eq('id', user.id)` — RLS enforces self-only writes
- E.164 phone validation happens client-side via the existing `buildPhoneE164` utility before saving
- No new RPC, edge function, or RLS policy needed — the existing profile update pattern (used in `GalleryConsultationForm`, `AuthContext`) is sufficient
- The card only renders the input form when the viewer is authenticated (for visitors, it shows a "Please log in" message)

### 6. State persistence
- Card submission state is **UI-local only** — on success, the component fetches the current `user_number` from the profile to determine display state
- No message metadata mutation needed — the card always re-checks the profile on mount
- This avoids needing to update the message `content` after submission and prevents stale state issues

### Files Changed

| File | Change |
|------|--------|
| `src/types/chat.ts` | Add `'phone_capture'` to `entityType`, add optional `phoneCaptureMeta` |
| `src/components/chat/PhoneCaptureCard.tsx` | **New** — reusable phone capture card component |
| `src/components/ui/expandable-chat-assistant.tsx` | Add `phone_capture` render branch |
| `src/components/dashboard/ChatAdmin.tsx` | Add `phone_capture` render branch |
| `src/components/wedding/components/ChatMessage.tsx` | Add `phone_capture` render branch |
| `src/components/chat/EntityPickerModal.tsx` | Add phone capture tab/option |
| `src/components/chat/QuickActionsButton.tsx` | Update tooltip text |

### No database changes required
The `messages.type = 'card'` and freeform JSON `content` column already support this. No migration needed.

