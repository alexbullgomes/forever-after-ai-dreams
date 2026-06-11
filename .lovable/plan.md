
## Current implementation

- **Card UI**: `src/components/chat/PhoneCaptureCard.tsx` renders a "Phone Number Required" form with a country dial code selector + phone input. On submit:
  - Authenticated path → updates `profiles.user_number`.
  - Visitor path → writes phone to `localStorage["visitor_phone"]` and calls the `visitor-chat` edge function with `action: 'submit_phone'`.
- **Edge function**: `supabase/functions/visitor-chat/index.ts` `submit_phone` validates `phone_e164` / dial code / national, upserts into `visitors`, and writes `phone_e164`, `phone_country_dial_code`, `phone_national`, `phone_updated_at` onto the matching `conversations` row (or creates one).
- **Admin UI**: `src/components/dashboard/ChatAdmin.tsx` reads `conversations` (including `phone_e164`, `user_name`, `visitor_id`) and shows the phone in the header/visitor info modal. It does not currently track a separate visitor-submitted name — `user_name` defaults to `'Visitor'` when the conversation is created.

## Changes

### 1. Database migration
Add nullable visitor-name fields, scoped to the guest conversation only (never touches `profiles`):

- `conversations.visitor_full_name text`
- `conversations.visitor_name_updated_at timestamptz`
- `visitors.visitor_full_name text`
- `visitors.visitor_name_updated_at timestamptz`

No GRANT changes needed (existing tables).

### 2. Edge function — `supabase/functions/visitor-chat/index.ts`
Extend the `submit_phone` action:
- Accept `visitor_full_name` (required for visitors).
- Validate: trim, non-empty, max 100 chars.
- On upsert to `visitors`, also write `visitor_full_name` + `visitor_name_updated_at`.
- On `conversations` update/insert, also write `visitor_full_name` + `visitor_name_updated_at`. Do NOT overwrite `user_name` if already set by a real user; only set it when null/'Visitor' so the conversation list shows the submitted name.

### 3. Visitor card — `src/components/chat/PhoneCaptureCard.tsx`
- Add `fullName` state with a text input above the phone field (placeholder "Your full name", maxLength 100).
- Title → "Contact Information Required"; description → "Please provide your name and phone number so we can reach you."
- Validation: require trimmed non-empty name, max 100 chars, in addition to phone validation.
- Visitor submit: include `visitor_full_name` in the edge function call; persist `localStorage["visitor_full_name"]` for restore.
- Success state displays both the saved name and phone. Pre-restore from localStorage on mount.
- Authenticated path unchanged (still updates `profiles.user_number` only) — name field is hidden for authenticated users to avoid touching their profile.

### 4. Admin UI — `src/components/dashboard/ChatAdmin.tsx`
- Extend the `Conversation` type and `select(...)` queries with `visitor_full_name`, `visitor_name_updated_at`.
- Conversation list (visitor rows): show `visitor_full_name` when present, keep the "Guest" badge, keep visitor ID line.
- Conversation header / visitor info modal: show submitted name prominently, with phone underneath. Keep "Guest" badge for visitor conversations.
- Realtime: existing `conversations` subscription propagates new fields automatically — no extra wiring.

## Safety

- Migration only adds nullable columns. No data backfill.
- Authenticated user flow and `profiles` table untouched.
- Edge function action remains additive; only the new field is required for visitor submissions (server still validates).
- No changes to n8n trigger, Stripe, AI/Human mode, or realtime channels.

## Acceptance check

After build: visitor opens the card → fills name + phone → submits → success card shows both → admin chat header + list row show the submitted name with Guest badge and phone → reload `/dashboard/chat-admin` retains both → authenticated phone capture still updates only `profiles.user_number`.
