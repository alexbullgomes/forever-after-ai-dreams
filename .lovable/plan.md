

# Fix Visitor Phone Capture Rendering + Persistence

## Root cause

I found two concrete issues causing the visitor flow to still fail:

1. **Visitor chat renders the wrong component**
   - In `src/components/ui/expandable-chat-webhook.tsx`, card messages are always rendered with `ChatCardMessage`.
   - Unlike the authenticated chat, it does **not** branch to `PhoneCaptureCard` when `entityType === 'phone_capture'`.
   - Result: visitors see only the generic card shell, not the actual phone form.

2. **Visitor DB persistence targets the wrong field / wrong write pattern**
   - `PhoneCaptureCard` currently uses:
     - `getVisitorId()` from localStorage
     - `.from("visitors").update(...).eq("id", visitorId)`
   - But the local visitor token is the public `visitor_id`, **not** the row primary key `id`.
   - Also, anonymous visitor writes in this project consistently use **upsert on `visitor_id`**, not raw update, to avoid public update-policy issues.
   - Result: localStorage may save, but DB persistence for visitors is unreliable or no-op.

## Safe implementation

### 1. Fix visitor chat rendering
Update `src/components/ui/expandable-chat-webhook.tsx` so it matches the authenticated chat behavior:

- If `message.type === 'card'` and `message.cardData?.entityType === 'phone_capture'`
  - render `PhoneCaptureCard`
- Else if card
  - render `ChatCardMessage`

This is a surgical rendering fix only for visitor chat cards.

### 2. Fix visitor persistence path in `PhoneCaptureCard`
Update `src/components/chat/PhoneCaptureCard.tsx` visitor submit logic:

- Use `getOrCreateVisitorId()` instead of `getVisitorId()` so the visitor always has an ID
- Save phone to `localStorage` as already planned
- Persist with:
  - `.from("visitors").upsert({ visitor_id, phone_number, last_seen_at, last_url? }, { onConflict: "visitor_id" })`
- Do **not** use `.eq("id", visitorId)`

This aligns with the project’s existing visitor-tracking pattern and avoids auth-policy regressions.

### 3. Keep authenticated merge logic as-is
`src/contexts/AuthContext.tsx` already contains the right merge behavior:

- on sign-in, read `visitor_phone`
- if profile has no `user_number`, copy it into `profiles.user_number`
- clear `visitor_phone`

I would keep that logic unchanged unless I find a small bug while wiring the above fix.

## Files to update

| File | Change |
|------|--------|
| `src/components/ui/expandable-chat-webhook.tsx` | Render `PhoneCaptureCard` for `phone_capture` cards in visitor chat |
| `src/components/chat/PhoneCaptureCard.tsx` | Replace visitor DB `update(...eq("id", ...))` with visitor-aware `upsert` on `visitor_id` |

## Why this is safe

- No UI redesign: visitors will see the same `PhoneCaptureCard` already used elsewhere
- No booking flow changes
- No auth redirect changes
- No webhook payload changes
- No chat schema changes
- No new table needed
- Authenticated users still update `profiles.user_number` exactly as before

## Validation checklist after implementation

1. Visitor receives phone capture card in chat
   - actual form renders, not generic card

2. Visitor submits phone number
   - success state appears
   - `visitor_phone` saved in localStorage
   - `visitors.phone_number` persisted by `visitor_id`

3. Visitor then logs in
   - `profiles.user_number` gets populated if empty
   - `visitor_phone` is removed from localStorage

4. Authenticated chat still works
   - same phone card behavior
   - no regression in product/campaign cards

5. Booking flow unchanged
   - visitor booking still gates at auth step only
   - no layout or modal regression

