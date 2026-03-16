

# Services → User Dashboard Migration (COMPLETED)

## Summary
Moved the Services page content into the User Dashboard as a "My Services" sidebar section. `/user-dashboard` is now the primary destination for logged-in users. `/services` redirects to `/user-dashboard/my-services`.

## Changes Made
- Created `src/pages/MyServices.tsx` with CampaignCardsSection, ProductsSection, EverAfterGallery
- Updated routing: `/services` → redirect to `/user-dashboard/my-services`
- Added "My Services" to UserDashboardSidebar as first nav item
- Updated Header "Account" button → `/user-dashboard`
- Updated all `/services` references across 12+ files
- Added ExpandableChatAssistant to UserDashboard layout
- DB migration: `user_dashboard` default set to `true`, existing profiles updated
- Edge function `cancelUrl` updated for Stripe checkout
