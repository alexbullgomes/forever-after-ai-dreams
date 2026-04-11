
Root cause
- The shared `UserProfileModal` currently navigates to `/dashboard/chat?conversationId=...`.
- The real admin chat route in this app is `/dashboard/chat-admin`, so ChatAdmin never mounts and its auto-open logic never runs.
- There is also a small reliability issue in `ChatAdmin`: it uses a boolean `autoOpenedRef`, which can ignore later deep-links if Chat Admin is already mounted.

Safe fix

1. Update `src/components/dashboard/UserProfileModal.tsx`
- Change the navigation target to `/dashboard/chat-admin?conversationId=${id}`.
- Keep the existing lookup logic exactly as-is:
  - first `customer_id = profile.id`
  - then fallback to `visitor_id = profile.visitor_id`
- Keep the existing “No conversation found” toast.
- This is the safest place to fix it because this modal is reused across Dashboard, Leads, Pipeline, Bookings, and Chat Admin.

2. Harden `src/components/dashboard/ChatAdmin.tsx`
- Keep the current direct DB fetch by `conversationId` (good approach).
- Replace the one-time boolean guard with a “last handled conversationId” ref so each new deep-link opens correctly, even when Chat Admin is already open.
- Continue clearing the query param after the conversation is selected.

3. Add a backward-compatible alias in `src/pages/AdminDashboard.tsx`
- Add a legacy `/dashboard/chat` redirect to `/dashboard/chat-admin`.
- Preserve query params during the redirect.
- This prevents regressions from old links, bookmarks, or any earlier code path still using `/dashboard/chat`.

Why this is safe
- No DB changes.
- No schema/RLS changes.
- No chat creation logic changes.
- No impact on visitor vs authenticated chat flows.
- Only route targeting and conversation auto-open behavior are being corrected.

Verification
- Open a user modal from Leads, Dashboard, Pipeline, and Bookings, then click “Open Conversation”:
  - it should first go to Chat Admin
  - then auto-open the correct conversation
- Test a profile with no conversation: toast should still appear.
- Test while already on Chat Admin: clicking “Open Conversation” for another user should still switch correctly.
- Test an old `/dashboard/chat?conversationId=...` URL: it should redirect and still open the conversation.
