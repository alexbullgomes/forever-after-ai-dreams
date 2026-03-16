

# Refactor Plan: Services → User Dashboard Migration

## Summary

Move the Services page (`/services` aka Planner.tsx) content into the User Dashboard as a "My Services" sidebar section, make `/user-dashboard` the primary destination for logged-in users, and keep `/services` as a redirect for backward compatibility.

## Current Architecture

- **Header "Account" button** → navigates to `/services`
- **`/services` route** → renders `Planner.tsx` (campaigns, products with booking funnels, gallery, chat assistant)
- **`/user-dashboard` route** → renders `UserDashboard.tsx` with sidebar (AI Assistant, Service Tracking, Affiliate)
- **Booking funnel** opens inside `ProductsSection` and `CampaignCardsSection` via `BookingFunnelModal` — fully self-contained
- **Post-login redirects**: `intendedRoute` in localStorage defaults to `/services`; booking state preserved via `bookingRedirect.ts`

## Migration Plan

### Step 1 — Add "My Services" route inside User Dashboard

Create a new component `src/pages/MyServices.tsx` that contains the core content from `Planner.tsx`:
- `CampaignCardsSection`
- `ProductsSection`
- `EverAfterGallery`

This is a lightweight wrapper — no auth check needed since `UserDashboard` already gates access. The `ExpandableChatAssistant` already renders app-wide (or will render at the dashboard level).

Add a new route in `UserDashboard.tsx`:
```
<Route path="/my-services" element={<MyServices />} />
```

Add "My Services" to `UserDashboardSidebar.tsx` navigation items (with a `Briefcase` icon).

### Step 2 — Update "Account" button destination

In `Header.tsx`, change `handleAccountClick` to navigate to `/user-dashboard` instead of `/services`.

### Step 3 — Redirect `/services` → `/user-dashboard/my-services`

Replace `Planner.tsx` route in `App.tsx` with a redirect component that sends authenticated users to `/user-dashboard/my-services` and unauthenticated users to `/` (preserving the current auth gate behavior).

### Step 4 — Update all `/services` references

Update navigation links across the codebase:

| File | Change |
|------|--------|
| `Header.tsx` | Account → `/user-dashboard` |
| `Hero.tsx` | Booking click → `/user-dashboard/my-services` |
| `Services.tsx` (landing cards) | `button_link` default → `/user-dashboard/my-services` |
| `ConsultationForm.tsx` | Redirect after submission → `/user-dashboard/my-services` |
| `Portfolio.tsx` | View portfolio → `/user-dashboard/my-services` |
| `QuizResult.tsx` | View packages → `/user-dashboard/my-services` |
| `BlogPostContent.tsx` | Explore services link → `/user-dashboard/my-services` |
| `UserDashboard.tsx` header | Remove "Services" button (now in sidebar) |
| `UserDashboardSidebar.tsx` | Remove "Services" quick link, add "My Services" nav item |
| `AdminDashboard.tsx` header | Update Services link to `/user-dashboard/my-services` |
| `DashboardNavigation.tsx` | Remove entirely or repurpose (no longer needed as standalone) |
| `EntityPickerModal.tsx` | Update `ctaUrl` to `/user-dashboard/my-services` |
| `intendedRoute` default in `ConsultationForm.tsx` | → `/user-dashboard/my-services` |
| `create-booking-checkout` edge function | `cancelUrl` → `/user-dashboard/my-services` |

### Step 5 — Auto-enable `user_dashboard` for new users

Create a Supabase migration that sets `user_dashboard` default to `true` in the profiles table, and update existing profiles:

```sql
ALTER TABLE profiles ALTER COLUMN user_dashboard SET DEFAULT true;
UPDATE profiles SET user_dashboard = true WHERE user_dashboard = false;
```

### Step 6 — Ensure ExpandableChatAssistant renders in dashboard

Verify the chat assistant renders inside `UserDashboard.tsx` so booking "Talk to our team" and `?openChat=true` continue working. If not present, add `<ExpandableChatAssistant />` to the dashboard layout.

## What stays untouched

- `BookingFunnelModal` and all booking components — no changes
- `bookingRedirect.ts` — booking state preservation logic unchanged
- `AuthContext.tsx` booking redirect handling — unchanged (it checks for pending booking state before any route redirect)
- `EmailAuthForm.tsx` promo route detection — unchanged
- Stripe checkout edge function logic (only `cancelUrl` string updates)
- All availability, slot hold, and checkout logic
- Campaign pages (`/promo/:slug`) — completely independent

## Risk Assessment

- **Booking during auth**: `bookingRedirect.ts` saves/restores state by campaign slug, not by `/services` route. Campaign bookings redirect back to `/promo/:slug`. Standard product bookings will work from the new `/user-dashboard/my-services` location since the modal is self-contained.
- **`intendedRoute` fallback**: Updated to point to new path. Existing localStorage values from before the migration will redirect to the old `/services` which hits the redirect → safe.
- **Edge function `cancelUrl`**: Updated to new path so Stripe cancel redirects land correctly.

## Files Modified

| Category | Files |
|----------|-------|
| New | `src/pages/MyServices.tsx` |
| Modified | `src/pages/UserDashboard.tsx`, `src/components/dashboard/UserDashboardSidebar.tsx`, `src/components/Header.tsx`, `src/App.tsx` |
| Updated references | `src/components/Hero.tsx`, `src/components/Services.tsx`, `src/components/ConsultationForm.tsx`, `src/components/Portfolio.tsx`, `src/components/quiz/QuizResult.tsx`, `src/components/blog/BlogPostContent.tsx`, `src/components/chat/EntityPickerModal.tsx`, `src/pages/AdminDashboard.tsx` |
| Edge function | `supabase/functions/create-booking-checkout/index.ts` |
| Migration | New migration for `user_dashboard` default |
| Deprecated | `src/components/dashboard/DashboardNavigation.tsx` (no longer needed) |

