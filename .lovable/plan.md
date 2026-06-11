# Fix: Visitor Phone Capture Not Visible in Chat Admin

## What's happening today

- `PhoneCaptureCard` (visitor path) writes the phone only to two places:
  - `localStorage["visitor_phone"]` (E.164 string)
  - `visitors.phone_number` (E.164 string, single field)
- The `conversations` table has **no phone columns**, and `ChatAdmin.tsx` only reads from `conversations` (`user_name`, `user_email`, `visitor_id`). It never joins to `visitors`.
- Result: the visitor saves the number successfully, but the admin sees nothing — there is no path from `visitors.phone_number` into the admin UI.
- Additionally, only the E.164 string is stored; dial code / national parts are lost (doesn't match the project's `phone_e164` / `phone_country_dial_code` / `phone_national` convention).

## Fix overview

Persist the phone server-side, linked to **both** the visitor and the active conversation, in the canonical 3-field format, and surface it in Chat Admin in real time via the existing `conversations` realtime subscription.

## Changes

### 1. Database migration
Add nullable phone columns to `conversations` and complete the set on `visitors`:

```sql
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS phone_country_dial_code text,
  ADD COLUMN IF NOT EXISTS phone_national text,
  ADD COLUMN IF NOT EXISTS phone_updated_at timestamptz;

ALTER TABLE public.visitors
  ADD COLUMN IF NOT EXISTS phone_country_dial_code text,
  ADD COLUMN IF NOT EXISTS phone_national text,
  ADD COLUMN IF NOT EXISTS phone_updated_at timestamptz;
```

`visitors.phone_number` is kept as the legacy E.164 mirror (backward compatibility). No RLS changes needed — writes happen via the edge function using the service role.

### 2. `supabase/functions/visitor-chat/index.ts`
Add a new action `submit_phone` (visitor flow, no auth required):

- Input: `visitor_id`, `phone_e164`, `phone_country_dial_code`, `phone_national`.
- Validation: visitor_id length ≥ 10; `phone_e164` regex `^\+[1-9]\d{6,15}$`; dial code regex `^\+\d{1,4}$`; national length 4–20.
- Upsert into `visitors` (phone_number + new 3 fields + phone_updated_at).
- Update the visitor's existing `conversations` row (matched by `visitor_id`) with the same fields. If none exists, create one (same defaults as `send_message`).
- Returns `{ success, conversation_id }`.

Existing `send_message` / `get_conversation` / `get_messages` paths untouched.

### 3. `src/components/chat/PhoneCaptureCard.tsx` (visitor path only)
Replace the direct `supabase.from('visitors').upsert(...)` call with `supabase.functions.invoke('visitor-chat', { body: { action: 'submit_phone', visitor_id, phone_e164, phone_country_dial_code, phone_national } })`. Keep:
- localStorage write (`visitor_phone`) for the on-card "saved" persistence across reloads.
- Authenticated-user path (writes to `profiles.user_number`) unchanged.
- All UI states, success card, validation messages unchanged.

### 4. `src/components/dashboard/ChatAdmin.tsx`
- Extend the `Conversation` type and the `select(...)` calls to include `phone_e164, phone_country_dial_code, phone_national, phone_updated_at`.
- In the conversation header / visitor info modal, add a "Phone" row showing `phone_e164` (with a copy-to-clipboard icon, matching existing styling). Show nothing if null.
- In the conversation list row preview for visitors, show a small phone icon + last 4 digits when present.
- Realtime: the component already subscribes to `conversations` changes; the new fields will flow through automatically (verify the subscription selects `*` or update it). No new subscription needed.

## Safety / non-regression

- No changes to: auth flow, n8n webhook payloads, message inserts, AI/Human mode, realtime broadcasts, Stripe, admin role checks, RLS on existing columns.
- New columns are nullable — existing rows and code paths unaffected.
- Edge function action is additive — no existing action signature changes.
- Validation rejects malformed input; service role write is scoped to the visitor_id supplied (same trust model as the existing `send_message` action — acceptable since visitor_id is the only identity primitive for guests).

## Acceptance verification
After build:
1. Visitor submits phone → success card shows "Phone number saved".
2. Admin chat header for that conversation shows the phone within ~1s (realtime), no refresh.
3. Reloading `/dashboard/chat` still shows it (persisted on `conversations`).
4. Authenticated user phone capture still writes to `profiles.user_number` only.
5. No console errors; existing visitor chat send/receive flow unchanged.
