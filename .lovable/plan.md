

# Context-Aware Campaign Auth Flow

## Problem

When a user logs in via Google OAuth on a campaign page (`/promo/:slug`) without an active booking flow, they get redirected to `/dashboard` instead of staying on the campaign page. Email/password login already handles this correctly.

## Root Cause

`GoogleAuthButton` (line 27) hardcodes `redirectUrl = /dashboard` and only overrides it for pending booking flows. It doesn't check if the user is currently on a `/promo/` page.

## Changes (2 files)

### 1. `src/components/auth/GoogleAuthButton.tsx`

Add campaign-page detection to the redirect URL logic:

```
// Current (line 27):
let redirectUrl = `${window.location.origin}/dashboard`;

// New:
const currentPath = window.location.pathname;
const isOnCampaignPage = currentPath.startsWith('/promo/');

let redirectUrl = isOnCampaignPage
  ? `${window.location.origin}${currentPath}`
  : `${window.location.origin}/dashboard`;
```

Then the existing booking override (lines 29-32) still takes priority. This ensures Google OAuth returns to the campaign page.

### 2. `src/contexts/AuthContext.tsx`

In the `onAuthStateChange` handler (around line 122), add a campaign-page check before the `intendedRoute` fallback so it doesn't redirect away:

```typescript
// After booking redirect check (line 120), before intendedRoute:
const currentPath = window.location.pathname;
if (currentPath.startsWith('/promo/')) {
  // Already on campaign page, don't redirect anywhere
  return;
}

// Fall back to legacy intendedRoute
const intendedRoute = localStorage.getItem('intendedRoute');
...
```

This prevents the `intendedRoute` mechanism from pulling users off campaign pages after Google OAuth returns them there.

## What stays untouched

- `EmailAuthForm` — already has correct `/promo/` logic
- `useGoogleAuth` hook — just closes modal, no redirect logic
- `AuthModal` — no changes needed
- Booking flow — booking redirect check runs first (higher priority)
- Chat flow — doesn't trigger page redirects
- All non-campaign pages — default `/dashboard` redirect unchanged

## Files Modified

| File | Change |
|------|--------|
| `src/components/auth/GoogleAuthButton.tsx` | Campaign-aware `redirectTo` URL |
| `src/contexts/AuthContext.tsx` | Skip `intendedRoute` redirect when on `/promo/` |

## Safety

- No new dependencies or storage keys needed
- Existing `bookingRedirect` system has higher priority and is unaffected
- No database changes
- No global auth logic changes — only two surgical additions

