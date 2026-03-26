

# Phone Capture Card: Remove Auth Dependency for Visitors

## Problem

`PhoneCaptureCard` blocks unauthenticated users entirely (lines 82-104), showing "Please log in" instead of the phone form. Visitors should be able to submit their phone number without logging in.

## Approach

No new database table needed. Use localStorage for visitor phone storage and the existing `visitors` table (add a `phone_number` column) for DB persistence. On auth, merge into `profiles.user_number`.

## Changes

### 1. Database Migration — Add `phone_number` to `visitors`

```sql
ALTER TABLE visitors ADD COLUMN phone_number text;
```

No new RLS needed — `visitors` already has public insert/upsert and admin read policies.

### 2. PhoneCaptureCard (`src/components/chat/PhoneCaptureCard.tsx`)

Remove the auth gate (lines 82-104). Change the submit logic:

- **If authenticated**: update `profiles.user_number` (existing behavior, unchanged)
- **If unauthenticated**: 
  - Save phone to `localStorage` key `visitor_phone`
  - Upsert `visitors` table with `visitor_id` + `phone_number`
  - Show success state

On mount:
- Check auth → if authed, check `profiles.user_number` (existing)
- If not authed, check `localStorage.getItem('visitor_phone')` → if exists, show success state

### 3. AuthContext (`src/contexts/AuthContext.tsx`)

Inside the `SIGNED_IN` handler (after `linkVisitorIdToProfile`), add:

```typescript
// Merge visitor phone into profile
const visitorPhone = localStorage.getItem('visitor_phone');
if (visitorPhone) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_number')
    .eq('id', session.user.id)
    .maybeSingle();
  
  if (!profile?.user_number) {
    await supabase.from('profiles')
      .update({ user_number: visitorPhone })
      .eq('id', session.user.id);
  }
  localStorage.removeItem('visitor_phone');
}
```

## Files Modified

| File | Change |
|------|--------|
| Migration | Add `phone_number` column to `visitors` |
| `src/components/chat/PhoneCaptureCard.tsx` | Remove auth gate, add visitor submit path |
| `src/contexts/AuthContext.tsx` | Merge `visitor_phone` on sign-in |

## Safety

- Authenticated flow unchanged — still updates `profiles.user_number` directly
- No changes to chat, booking, or webhook systems
- Visitor phone persists across page refreshes via localStorage
- On login, phone merges into profile only if `user_number` is not already set (no overwrite)
- No UI/UX changes — same form, same success state

