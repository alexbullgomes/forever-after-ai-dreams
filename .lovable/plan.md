

# Step 3: Affiliate Conversations — Implementation Plan

## Overview

Build the Affiliate Conversations feature: RLS policies for scoped access, a new page at `/user-dashboard/affiliate-conversations`, sidebar entry conditional on `can_access_affiliate_conversations`, and admin toggle in UserProfileModal.

## Database Changes (1 migration)

### RLS Policies

Three new policies using the existing `can_access_affiliate_conversations` column (already added in previous migration):

1. **Conversations SELECT** — Affiliates can view conversations where `conversations.referral_code` matches their `affiliates.referral_code`, gated by `profiles.can_access_affiliate_conversations = true` and `affiliates.is_active = true`.

2. **Messages SELECT** — Affiliates can read messages belonging to conversations they can access (same join logic).

3. **Messages INSERT** — Affiliates can respond in those conversations. The inserted message role will be `'human'` to match the admin pattern.

All three use subqueries against `affiliates` and `profiles` — no recursive RLS risk since neither table is the one being queried.

## Frontend Changes

### 1. New page: `src/pages/AffiliateConversations.tsx`

A simplified version of `ChatAdmin.tsx` with these differences:
- No admin role check — instead checks `can_access_affiliate_conversations` from profile
- Fetches conversations filtered by `referral_code` matching the user's affiliate referral code
- Conversation list (left panel) + message view (right panel) — same layout as ChatAdmin
- Reply input enabled only when conversation `mode = 'human'` (same as admin)
- No mode toggle (affiliates cannot switch AI/human mode)
- No card sending, no entity picker, no profile modal
- Read-only conversation metadata (user name, timestamps)

### 2. Sidebar entry: `UserDashboardSidebar.tsx`

- Add "Conversations" nav item with `MessageSquare` icon
- Only render when user has `can_access_affiliate_conversations = true` (fetch from profiles on mount)
- URL: `/user-dashboard/affiliate-conversations`

### 3. Route: `UserDashboard.tsx`

- Add lazy import for `AffiliateConversations`
- Add route: `<Route path="/affiliate-conversations" element={<AffiliateConversations />} />`

### 4. Admin toggle: `UserProfileModal.tsx`

- Add a new Switch toggle below the existing "User Dashboard Access" toggle
- Label: "Affiliate Conversations Access"
- Description: "Enable to allow this affiliate to view and respond to conversations from their referrals"
- Updates `profiles.can_access_affiliate_conversations` directly (same pattern as existing toggles)

## Files Modified

| File | Change |
|------|--------|
| New migration | 3 RLS policies (conversations SELECT, messages SELECT, messages INSERT) |
| `src/pages/AffiliateConversations.tsx` | New page — conversation list + message view |
| `src/pages/UserDashboard.tsx` | Add route for affiliate-conversations |
| `src/components/dashboard/UserDashboardSidebar.tsx` | Conditional "Conversations" nav item |
| `src/components/dashboard/UserProfileModal.tsx` | Add affiliate conversations toggle |
| `src/integrations/supabase/types.ts` | Auto-updated by Supabase (no manual edit) |

## Security

- Affiliates can ONLY see conversations with matching `referral_code`
- Access gated by both `affiliates.is_active` AND `profiles.can_access_affiliate_conversations`
- Admin must explicitly enable the toggle per user
- Admin chat remains completely unchanged — no policies removed or modified
- Affiliate cannot change conversation mode (AI/human)

