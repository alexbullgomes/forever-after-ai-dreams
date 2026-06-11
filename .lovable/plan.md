# Fix: Phone-capture form leaks saved values across cards/conversations

## Why the bug is happening

`src/components/chat/PhoneCaptureCard.tsx` treats "saved" as a **global** state instead of a per-message state:

1. On mount it runs `init()`:
   - If authenticated → reads `profiles.user_number` and, if present, sets `state = "success"` with that number.
   - If visitor → reads `localStorage["visitor_phone"]` + `localStorage["visitor_full_name"]` and, if present, sets `state = "success"` with those values.
2. Because every `PhoneCaptureCard` instance runs this same check, the moment any phone has been saved (by the admin's own profile, or by the visitor's prior submission), **every card on that browser** — old cards, newly received cards, the admin's preview, and admin-side rendered cards — flips to the success state showing that one saved value.
3. That is also why the Full Name input "doesn't appear": the success state replaces the entire form (`{state === "success" ? success : <form>}`), so the new name field never renders. The admin's preview additionally hides the name field because the preview is rendered as an authenticated user (`isVisitor = false`).
4. Nothing about the saved phone is scoped to `message.id`, `conversation_id`, or `visitor_id`. The phone is also written onto `conversations` (and on admin side, possibly the admin's own `profiles.user_number`), and every card just reflects whatever the current global value is.

So a single submission in one conversation appears inside every other card, and new blank forms never render.

## Fix strategy

Make the phone-capture card a **per-message interactive card** whose submitted state lives on that specific message, not in shared storage.

### 1. `messages.metadata` becomes the source of truth for a card's submitted state

No schema change needed — `messages.metadata jsonb` already exists. On submit we'll write:

```json
{ "phoneCapture": {
    "submittedNumber": "+15551234567",
    "submittedName": "Jane Doe",
    "submittedAt": "2026-06-11T..." } }
```

A card renders the success state **only if its own `message.metadata.phoneCapture.submittedNumber` is set**. Otherwise it renders blank inputs.

### 2. Edge function `supabase/functions/visitor-chat/index.ts` — extend `submit_phone`

- Accept optional `message_id` (number) in addition to existing fields.
- Keep current behavior: upsert `visitors` (phone + `visitor_full_name`) and update `conversations` (phone fields, `visitor_full_name`, `visitor_name_updated_at`, `user_name` only if null/`'Visitor'`).
- New: if `message_id` is provided and the message belongs to the same `visitor_id`/`conversation_id`, update `messages.metadata` to merge in `phoneCapture: { submittedNumber, submittedName, submittedAt }`. Use service role; scope the update with `.eq('id', message_id).eq('visitor_id', visitor_id)` so a card from another visitor can never be tagged.

### 3. `src/components/chat/PhoneCaptureCard.tsx` — rewrite the state model

- New props: `messageId?: string | number`, `conversationId?: string`, `submittedMeta?: { submittedNumber: string; submittedName?: string | null }`, `readOnly?: boolean` (admin), `previewOnly?: boolean` (EntityPickerModal preview).
- Remove the `useEffect` that reads `profiles.user_number` and the one that reads `localStorage["visitor_phone"]` / `visitor_full_name`. The card never auto-fills from anywhere.
- Initial state: if `submittedMeta?.submittedNumber` is present, render success with **those** values only. Otherwise render blank `fullName` + `phoneValue` inputs.
- Still detect auth (only to decide whether to show the Full Name field) but do **not** query the profile or set success from it.
- Visitor submit path: send `message_id` to the edge function along with `visitor_full_name` + phone fields. On success, set local `state = "success"` with the just-submitted values (so the visitor instantly sees their card update; persistence is handled by the edge function for reloads).
- Authenticated submit path (when card is shown in an authenticated user's chat, not admin): unchanged behavior — still updates `profiles.user_number` and shows success **locally** for that card; no localStorage write.
- `readOnly` (admin viewing a sent card): never render the inputs. If `submittedMeta` is set, show submitted values; otherwise show a muted "Awaiting visitor response" state.
- `previewOnly` (EntityPickerModal): always render the blank inputs (disabled) just as a visual preview; never call the edge function and never read storage.
- Stop writing to `localStorage["visitor_phone"]` / `localStorage["visitor_full_name"]` — these are what cause cross-card leakage and are not needed (metadata + conversation row hold the data).

### 4. Render sites — pass `messageId` + `submittedMeta`, mark admin as readOnly

Parse `message.metadata?.phoneCapture` once per message and pass it down.

- `src/components/ui/expandable-chat-webhook.tsx` (visitor): include `metadata` when mapping DB messages (`dbMsg.metadata`) onto the local message shape, then pass `messageId={message.id}`, `conversationId={conversationId}`, `submittedMeta={message.metadata?.phoneCapture}` to `<PhoneCaptureCard>`.
- `src/components/ui/expandable-chat-assistant.tsx` (authenticated user): same — pass `messageId`, `submittedMeta` from `dbMessage.metadata`.
- `src/components/wedding/components/ChatMessage.tsx`: same.
- `src/components/dashboard/ChatAdmin.tsx`: pass `messageId`, `submittedMeta` from `message.metadata?.phoneCapture`, and add `readOnly`. Admin never sees the form inputs — only blank/awaiting or the visitor's submitted values for that specific card.
- `src/components/chat/EntityPickerModal.tsx` preview: pass `previewOnly` so the preview is always a blank, disabled illustration with both Full Name and Phone Number fields visible — accurately representing what the visitor will receive.

### 5. Admin header / conversation list (already wired)

`ChatAdmin` already reads `conversations.visitor_full_name` + `phone_e164` for the header/list. No change needed; this becomes the single place admins see the latest contact info per conversation.

## Acceptance criteria

1. Admin opens "Send a Card → Actions → Request Phone Number" → preview now shows blank **Full Name** + **Phone Number** fields.
2. Admin sends the card to Visitor A → Visitor A sees blank Full Name + Phone Number inputs.
3. Visitor A submits → only Visitor A's card flips to success with their name + phone. No other card (visitor or admin side) changes.
4. Admin sees Visitor A's name + phone in the conversation header/list and inside that specific submitted card.
5. Admin sends a new card to Visitor B → Visitor B's card is blank; Visitor A's values never appear in Visitor B's form or in any other card.
6. Reloading the admin dashboard or visitor chat preserves each card's own submitted state via `messages.metadata`, and the conversation header still shows the per-visitor contact info.
7. AI/Human mode, n8n flow, realtime subscriptions, authenticated chat, and existing card types continue working — changes are additive (one new optional `message_id` field on `submit_phone`, new optional props on the card, message metadata writes).

## Files touched

- `supabase/functions/visitor-chat/index.ts` — extend `submit_phone` to update `messages.metadata`.
- `src/components/chat/PhoneCaptureCard.tsx` — remove global prefill, add per-message props, add `readOnly` / `previewOnly` modes.
- `src/components/ui/expandable-chat-webhook.tsx` — pass metadata + messageId.
- `src/components/ui/expandable-chat-assistant.tsx` — pass metadata + messageId.
- `src/components/wedding/components/ChatMessage.tsx` — pass metadata + messageId.
- `src/components/dashboard/ChatAdmin.tsx` — pass metadata + messageId + `readOnly`.
- `src/components/chat/EntityPickerModal.tsx` — render preview with `previewOnly`.

No DB migration required.
