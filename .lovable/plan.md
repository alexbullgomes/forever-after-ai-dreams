

# Analysis & Plan: Chat Payload Enrichment + Affiliate Conversations

## Current System Architecture

**Chat flow (unchanged)**:
1. Frontend inserts message into `messages` table (authenticated: direct Supabase insert; visitor: via `visitor-chat` edge function)
2. DB trigger `emit_message_webhook` fires on user-role INSERT → sends payload to n8n webhook
3. n8n processes → calls `chat-webhook-callback` edge function → inserts AI response
4. Realtime (postgres_changes for auth users, Broadcast for visitors) delivers response to UI

**Conversations table columns**: `id`, `customer_id`, `visitor_id`, `mode`, `taken_by`, `taken_at`, `user_name`, `user_email`, `new_msg`, `public_code`, `created_at`

**Message insertion points**:
- `expandable-chat-assistant.tsx` line 329: `supabase.from('messages').insert(...)` — authenticated users
- `expandable-chat-assistant.tsx` line 565: same, for auto-message from booking CTA
- `expandable-chat-webhook.tsx` line 315: `visitor-chat` edge function call — visitors
- `expandable-chat-webhook.tsx` line 423: `handleSubmit` — regular visitor messages

**Conversation creation points**:
- `expandable-chat-assistant.tsx` line 151: `supabase.from('conversations').insert(...)` — authenticated
- `visitor-chat` edge function: creates conversation for visitors

---

## STEP 1 — Payload Enrichment (Context + Attribution)

### Approach

The DB trigger `emit_message_webhook` builds the payload from the `messages` row and `conversations` table. To enrich the payload **without changing the trigger**, we store context/attribution data in the `messages` table itself using a new nullable JSONB column.

**Why this approach**: Adding a JSONB column to `messages` means:
- The existing trigger can include it in the payload automatically (we add it to the `message` object in the trigger)
- No new tables, no new webhooks
- Fully backward-compatible (nullable, defaults to NULL)
- n8n receives the extra data passively — existing workflows ignore unknown fields

### Database Changes

**Migration 1**: Add `metadata` JSONB column to `messages`
```sql
ALTER TABLE messages ADD COLUMN metadata jsonb DEFAULT NULL;
```

**Migration 2**: Update `emit_message_webhook` trigger function to include `metadata` in payload
```sql
-- Add to the 'message' jsonb_build_object:
'metadata', NEW.metadata
```

### Frontend Changes

Create a utility `src/utils/chatContext.ts`:
```typescript
export function getChatMetadata() {
  const referralCode = localStorage.getItem('everafter_referral_code');
  const pathname = window.location.pathname;
  let pageType = 'other';
  let campaignSlug = null;

  if (pathname === '/') pageType = 'homepage';
  else if (pathname.startsWith('/promo/')) {
    pageType = 'campaign';
    campaignSlug = pathname.split('/promo/')[1]?.split('?')[0];
  }
  else if (pathname.startsWith('/user-dashboard')) pageType = 'dashboard';
  else if (pathname.startsWith('/blog')) pageType = 'blog';

  return {
    context: {
      page_url: window.location.href,
      page_path: pathname,
      page_title: document.title,
      referrer: document.referrer || null,
      page_type: pageType,
      campaign_slug: campaignSlug,
    },
    attribution: referralCode ? {
      referral_code: referralCode,
      source_type: campaignSlug ? 'campaign' : 'organic',
    } : null,
  };
}
```

Then, in every `messages` insert call (4 locations in assistant + webhook components), add:
```typescript
metadata: getChatMetadata()
```

This is additive — the insert just gets one more nullable field.

For visitor chat, the `visitor-chat` edge function would accept an optional `metadata` field in the request body and pass it through to the DB insert.

### n8n Impact

None. The webhook payload will now include a `metadata` field inside the `message` object. Existing n8n workflows will ignore it. Future workflows can read `message.metadata.context.page_url`, etc.

---

## STEP 2 — Conversation Attribution

### Database Changes

**Migration 3**: Add attribution columns to `conversations`
```sql
ALTER TABLE conversations
  ADD COLUMN page_path text DEFAULT NULL,
  ADD COLUMN page_type text DEFAULT NULL,
  ADD COLUMN campaign_slug text DEFAULT NULL,
  ADD COLUMN referral_code text DEFAULT NULL;
```

All nullable, no breaking changes.

### Frontend Changes

Update conversation creation in `expandable-chat-assistant.tsx` (line 153) to include:
```typescript
const meta = getChatMetadata();
// ... in the insert:
page_path: meta.context.page_path,
page_type: meta.context.page_type,
campaign_slug: meta.context.campaign_slug,
referral_code: meta.attribution?.referral_code || null,
```

Update `visitor-chat` edge function conversation creation to accept and store these fields.

**Important**: Only set on conversation CREATE, not on every message. Existing conversations are untouched.

---

## STEP 3 — Affiliate Conversations Feature (Architecture Plan Only)

### Database Changes

**Migration 4**: Add toggle to `profiles`
```sql
ALTER TABLE profiles
  ADD COLUMN can_access_affiliate_conversations boolean NOT NULL DEFAULT false;
```

**Migration 5**: Add RLS policy for affiliate conversation access
```sql
-- Affiliates can view conversations tied to their referral_code
CREATE POLICY "Affiliates can view their referral conversations"
ON conversations
FOR SELECT
TO authenticated
USING (
  referral_code IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM affiliates a
    JOIN profiles p ON p.id = auth.uid()
    WHERE a.user_id = auth.uid()
      AND a.referral_code = conversations.referral_code
      AND a.is_active = true
      AND p.can_access_affiliate_conversations = true
  )
);

-- Affiliates can read messages in those conversations
CREATE POLICY "Affiliates can view messages in their referral conversations"
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN affiliates a ON a.referral_code = c.referral_code
    JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = messages.conversation_id
      AND a.user_id = auth.uid()
      AND a.is_active = true
      AND p.can_access_affiliate_conversations = true
  )
);

-- Affiliates can INSERT messages (respond) in their referral conversations
CREATE POLICY "Affiliates can respond in their referral conversations"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN affiliates a ON a.referral_code = c.referral_code
    JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = conversation_id
      AND a.user_id = auth.uid()
      AND a.is_active = true
      AND p.can_access_affiliate_conversations = true
  )
);
```

### Frontend (Future — architecture only)

- New page: `src/pages/AffiliateConversations.tsx`
- Route: `/user-dashboard/affiliate-conversations`
- Sidebar entry in `UserDashboardSidebar.tsx` (visible only when `can_access_affiliate_conversations = true`)
- Reuse `ChatAdmin` component patterns (message list, reply input) scoped to affiliate's referral_code
- Admin toggle in profile editor (`PipelineProcess.tsx` or profile modal) — simple Switch component bound to `can_access_affiliate_conversations`

### Access Control Summary

| User Type | Sees | Can Respond |
|-----------|------|-------------|
| Admin | ALL conversations | Yes |
| Affiliate (toggle ON) | Only conversations with matching `referral_code` | Yes |
| Affiliate (toggle OFF) | None | No |
| Regular user | Only their own conversation | No (only send) |

---

## Implementation Order

1. **Migration**: Add `metadata` to `messages` table
2. **Migration**: Update `emit_message_webhook` to include `metadata` in payload
3. **Code**: Create `chatContext.ts` utility
4. **Code**: Add `metadata` to all 4 message insert points + visitor-chat edge function
5. **Migration**: Add attribution columns to `conversations`
6. **Code**: Populate attribution on conversation creation (both components + edge function)
7. **Migration**: Add `can_access_affiliate_conversations` to `profiles`
8. *(Future)* Build affiliate conversations page + RLS policies + admin toggle

Steps 1-6 are safe to implement now. Steps 7-8 are planning only.

## Risk Assessment

- **No existing fields modified or removed** — all changes are additive nullable columns
- **Trigger update** is backward-compatible — just adds one more key to the JSON object
- **n8n webhook URL unchanged** — same endpoint, richer payload
- **Admin chat unaffected** — no changes to ChatAdmin or conversation management
- **Booking flow unaffected** — no changes to booking components
- **RLS policies for affiliate access** use SECURITY DEFINER-style subqueries — no recursive risk

