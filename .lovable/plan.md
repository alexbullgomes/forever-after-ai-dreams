

# Fix: Email Auth Redirect During Campaign Booking Flow

## Root Cause

The issue is a **race condition** between `EmailAuthForm` and `AuthContext`.

**Google OAuth** works because `signInWithOAuth` triggers a full page redirect to Google, then back to the `redirectTo` URL (the campaign page). The browser navigates to the campaign page, and the booking state is restored from sessionStorage.

**Email/password** auth works differently — `signInWithPassword` / `signUp` completes in-place (no page reload). Two things then compete:

1. **`EmailAuthForm.tsx` (lines 45-67, 87-109)**: After successful auth, it calls `hasPendingBooking()`. If true, it just closes the modal. If false, it redirects to `/dashboard`.

2. **`AuthContext.tsx` (lines 82-100)**: The `onAuthStateChange` listener fires `SIGNED_IN`, runs `handleBookingRedirect()`, and if there's a pending booking + we're already on the correct page, it sets `redirectHandledRef.current = true` and returns.

The problem: Both run nearly simultaneously. `EmailAuthForm` checks `hasPendingBooking()` synchronously right after the auth call. If the booking state **was** saved, it works. But there's a subtler issue — after `onClose()`, `AuthContext`'s `handleBookingRedirect` also fires. When it detects we're already on the target page, it correctly does nothing. So the flow *should* work when booking state exists.

**The actual bug**: When a user clicks "Reserve" on a standard product card (not campaign-gated), the auth gate happens later. In this case, `saveBookingState` is only called for `campaignMode` or `campaignProductMode`. For standard product flows or when the auth modal is triggered by other means (e.g., clicking "Login" button), `hasPendingBooking()` returns `false`, and `EmailAuthForm` hardcodes `window.location.href = '/dashboard'` — even if the user is on a campaign page.

**The fix**: When there's no pending booking but the user is already on a `/promo/` page, `EmailAuthForm` should stay on the current page instead of redirecting to `/dashboard`.

## Plan

### File: `src/components/auth/EmailAuthForm.tsx`

In both the login and signup success branches (lines 57-67 and lines 99-109), change the "no pending booking" fallback:

- Before redirecting to `/dashboard`, check if the current URL starts with `/promo/`
- If yes: just close the modal and stay on the page (the user was browsing a campaign)
- If no: redirect to `/dashboard` as before

This is a 2-line change in each branch (4 lines total). The logic:

```typescript
const currentPath = window.location.pathname;
const stayOnPage = currentPath.startsWith('/promo/');

if (stayOnPage) {
  onClose();
} else {
  onClose();
  window.location.href = '/dashboard';
}
```

### No other files need changes

- `saveBookingState` / `hasPendingBooking` continue to work for campaign-gated booking flows
- `AuthContext` redirect logic remains untouched
- Google OAuth flow remains untouched
- Campaign routing unchanged

