

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

---

# Chat Payload Enrichment + Affiliate Conversations Prep (COMPLETED)

## Summary
Enriched chat payloads with page context and attribution data. Prepared database schema for future affiliate conversations feature.

## Changes Made

### Database (Migration)
- Added `metadata` JSONB column to `messages` table (nullable, default NULL)
- Added attribution columns to `conversations`: `page_path`, `page_type`, `campaign_slug`, `referral_code` (all nullable)
- Added `can_access_affiliate_conversations` boolean to `profiles` (default false)
- Updated `emit_message_webhook` trigger to include `metadata` in webhook payload

### Frontend
- Created `src/utils/chatContext.ts` — `getChatMetadata()` utility capturing page_url, page_path, page_title, referrer, page_type, campaign_slug, referral_code
- Updated `expandable-chat-assistant.tsx`: metadata added to both message insert points + attribution on conversation creation
- Updated `expandable-chat-webhook.tsx`: metadata passed in both visitor-chat API calls

### Edge Function
- Updated `visitor-chat` to accept optional `metadata` field in request body
- Metadata passed through to message insert
- Attribution fields populated on conversation creation

### What's NOT changed
- n8n webhook URL — unchanged
- Admin chat (ChatAdmin) — unchanged
- Booking flow — unchanged
- Existing payload structure — only additive fields

### Future (Step 3 — not yet implemented)
- Affiliate Conversations page at `/user-dashboard/affiliate-conversations`
- RLS policies for affiliate conversation access
- Admin toggle in profile editor for `can_access_affiliate_conversations`
