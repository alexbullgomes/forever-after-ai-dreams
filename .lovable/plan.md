

# Fix: Duplicate Webhooks + Campaign Redirect After Google Login

## Root Cause Analysis

### Issue 1 — Triple n8n requests

There are **two separate `onAuthStateChange` listeners** running simultaneously:

1. **`AuthContext.tsx` (line 85)** — global listener, always active
2. **`useGoogleAuth.ts` (line 12)** — second listener mounted inside `AuthModal`, calls `sendGoogleAuthWebhook`

When Google OAuth completes, Supabase fires `SIGNED_IN` on **both** listeners. Additionally, Supabase can emit multiple events during OAuth (e.g., `INITIAL_SESSION` then `SIGNED_IN`, or `TOKEN_REFRESHED`), causing the `useGoogleAuth` hook to fire multiple times since it only checks `event === 'SIGNED_IN'` with no deduplication guard.

This produces 2-3 webhook calls per login.

### Issue 2 — Campaign redirect to homepage

The `GoogleAuthButton` correctly sets `redirectTo` to the campaign URL. However, Supabase OAuth requires all redirect URLs to be **whitelisted** in the Supabase dashboard under Authentication > URL Configuration. If `/promo/*` paths are not in the allowlist, Supabase falls back to the **Site URL** (homepage). This is a dashboard configuration issue, not a code issue — but we should also add a `sessionStorage` fallback to recover the campaign URL post-redirect.

## Changes

### 1. Consolidate auth webhook into `AuthContext.tsx` and remove duplicate listener

**Delete**: `src/hooks/useGoogleAuth.ts` — this hook creates a redundant `onAuthStateChange` listener.

**Modify**: `src/components/AuthModal.tsx` — remove `useGoogleAuth` import and usage.

**Modify**: `src/contexts/AuthContext.tsx` — add Google webhook logic (with dedup) inside the existing `SIGNED_IN` handler:

```typescript
// Add ref to prevent duplicate webhook sends
const webhookSentRef = useRef(false);

// Inside the SIGNED_IN handler, after existing logic:
if (event === 'SIGNED_IN' && session?.user) {
  setTimeout(async () => {
    // ... existing visitor linking code ...

    // Send auth webhook ONCE (deduplicated)
    if (!webhookSentRef.current) {
      webhookSentRef.current = true;
      const isGoogleAuth = session.user.app_metadata?.provider === 'google';
      const isNewUser = (now.getTime() - createdAt.getTime()) < 10000;
      const webhookEvent = isNewUser ? 'register' : 'login';

      if (isGoogleAuth) {
        const fullName = session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.name || '';
        await sendGoogleAuthWebhook(webhookEvent, session.user.id, 
                                     session.user.email || '', fullName);
      }
      // Email auth webhook is already sent in EmailAuthForm — no duplication
    }
  }, 0);
}
```

Reset `webhookSentRef` on sign out.

### 2. Add campaign URL recovery via `sessionStorage`

**Modify**: `src/components/auth/GoogleAuthButton.tsx` — before triggering OAuth, save campaign path:

```typescript
if (isOnCampaignPage) {
  sessionStorage.setItem('auth_campaign_return', currentPath);
}
```

**Modify**: `src/contexts/AuthContext.tsx` — in the `SIGNED_IN` handler, check for stored campaign return before `intendedRoute` fallback:

```typescript
// Check sessionStorage for campaign return (Google OAuth fallback)
const campaignReturn = sessionStorage.getItem('auth_campaign_return');
if (campaignReturn && campaignReturn.startsWith('/promo/')) {
  sessionStorage.removeItem('auth_campaign_return');
  if (!currentPath.startsWith('/promo/')) {
    window.location.replace(campaignReturn);
  }
  return;
}
```

### 3. Supabase Dashboard — redirect URL whitelist

The user needs to add a wildcard redirect URL in Supabase dashboard:

- Go to Authentication > URL Configuration > Redirect URLs
- Add: `https://everafter-studio.lovable.app/promo/**`
- Add: `https://id-preview--b50c6da6-66bc-437c-9e46-f8662a567a74.lovable.app/promo/**`

Without this, Google OAuth `redirectTo` to `/promo/...` will always fall back to the Site URL.

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useGoogleAuth.ts` | **Delete** — redundant listener causing duplicates |
| `src/components/AuthModal.tsx` | Remove `useGoogleAuth` import and call |
| `src/contexts/AuthContext.tsx` | Add deduplicated Google webhook + campaign return recovery |
| `src/components/auth/GoogleAuthButton.tsx` | Save campaign path to sessionStorage before OAuth |

## Safety

- Email auth webhook stays in `EmailAuthForm` (called inline, not via listener) — no change
- `sendGoogleAuthWebhook` moves to the single `AuthContext` listener with a ref guard — fires exactly once
- Booking flow unaffected — booking redirect check runs before campaign return check
- Chat system unaffected — no changes to message or conversation logic
- No database changes required

