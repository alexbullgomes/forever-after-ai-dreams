

## Deprecate Legacy Wedding Packages System

This plan removes the old `/wedding-packages` flow, its dedicated `create-checkout` edge function, and the legacy wedding payment processing in the Stripe webhook. The centralized booking system (`create-booking-checkout` + `processBookingPayment`) remains fully intact.

---

### Files to Delete

| File | Reason |
|------|--------|
| `src/pages/WeddingPackages.tsx` | Legacy page |
| `src/components/wedding/WeddingPackagesHeader.tsx` | Only used by WeddingPackages page |
| `src/components/wedding/PackageCard.tsx` | Only used by PackageSection (WeddingPackages) |
| `src/components/wedding/PackageSection.tsx` | Only used by WeddingPackages page |
| `src/components/wedding/CustomPackageCard.tsx` | Only used by WeddingPackages page |
| `src/components/wedding/CTASection.tsx` | Only used by WeddingPackages page |
| `src/components/wedding/LoadingState.tsx` | Only used by WeddingPackages page |
| `src/components/wedding/PackagesNavigation.tsx` | Only used by WeddingPackages page |
| `src/components/wedding/PageHeader.tsx` | Only used by WeddingPackages page |
| `src/components/wedding/PaymentButton.tsx` | Legacy checkout -- calls `create-checkout` |
| `src/data/weddingPackages.ts` | Static package data for legacy page |
| `supabase/functions/create-checkout/index.ts` | Legacy edge function |

**NOT deleted** (used by chat system): `src/components/wedding/components/AudioPlayer.tsx`, `ChatHistory.tsx`, `ChatMessage.tsx`, `utils/*`, `AIAssistantSection.tsx`

---

### Files to Modify

**1. `src/App.tsx`**
- Remove `WeddingPackages` lazy import
- Remove `/wedding-packages` route

**2. `src/contexts/AuthContext.tsx`**
- Remove `PENDING_PAYMENT_KEY`, `PendingPayment` interface, `PAYMENT_EXPIRY_MS`
- Remove `processPendingPayment` function and its `create-checkout` invocation
- Remove the call to `processPendingPayment` from the auth state change handler

**3. `src/components/dashboard/DashboardNavigation.tsx`**
- Remove `usePageVisibility` import and `showWeddingPackages` usage
- Remove the conditional Wedding Packages nav link

**4. `src/components/planner/ExploreServicesSection.tsx`**
- Remove the entire component (it only renders a link to `/wedding-packages`)
- OR remove the wedding packages card/link and keep the component if it has other content

**5. `src/components/quiz/QuizResult.tsx`**
- Change `navigate('/wedding-packages')` to `navigate('/services')` (redirect to services instead)

**6. `src/pages/PaymentSuccess.tsx`**
- Change "View Your Booking" button from `/wedding-packages` to `/services`

**7. `src/components/admin/settings/ContentSection.tsx`**
- Remove the "Show Wedding Packages page" toggle and all related `usePageVisibility` usage

**8. `src/hooks/usePageVisibility.ts`**
- Delete this hook entirely (only purpose was wedding packages visibility toggle)

**9. `src/components/auth/GoogleAuthButton.tsx`**
- Remove legacy `pendingPayment` localStorage check (lines 27-28, 36-37)

**10. `supabase/config.toml`**
- Remove `[functions.create-checkout]` section

**11. `supabase/functions/stripe-webhook/index.ts`**
- Remove `processWeddingPackagePayment` function entirely
- Remove the `else if (payment_type === 'deposit' || payment_type === 'full')` conditional block in `handleCheckoutComplete`
- Remove `payment_type` and `package_name` from metadata destructuring (only used by legacy flow)
- Keep `processBookingPayment` fully intact

**12. `public/robots.txt`**
- Remove `Disallow: /wedding-packages` from all user-agent blocks

**13. `public/sitemap.xml`**
- No changes needed (wedding-packages was never in the sitemap)

---

### Database Considerations

- **`profiles.package_consultation`**: Currently set by `processWeddingPackagePayment` which is being removed. This column may still be useful for admin notes. No schema change -- just note it is no longer auto-populated by the legacy flow.
- **`profiles.pipeline_status`**: The value `'Closed Deal & Pre-Production'` was set by the legacy flow, but this column is still used by the pipeline system generally. No change needed.
- **No tables are dropped.** `bookings`, `products`, `campaign_packages`, `booking_requests`, `booking_slot_holds` all remain untouched.

---

### What Remains Intact

- `create-booking-checkout` edge function (centralized booking)
- `processBookingPayment` in `stripe-webhook` (centralized payment processing)
- All booking funnel components (`BookingFunnelModal`, etc.)
- Chat system components in `src/components/wedding/components/` and `utils/`
- `AIAssistantSection` component (used by AIAssistant page)
- Wedding gallery pages and data
- All RLS policies unchanged

---

### Edge Function Deployment

- Deploy updated `stripe-webhook` after removing `processWeddingPackagePayment`
- Delete deployed `create-checkout` function from Supabase

