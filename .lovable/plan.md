# Chat Admin — Favorites + Safe Visitor Archive

## Summary
Two admin-only additions to Chat Admin: (1) star/favorite leads & customers, (2) safe archive of visitor-only conversations with snapshot/preview/restore. No deletes. No changes to chat realtime, n8n webhooks, or existing RLS surface.

---

## Part 1 — Favorites

### Schema changes

**`conversations`** (for visitor-only favorites):
- `is_favorite_lead boolean NOT NULL DEFAULT false`
- `favorite_lead_at timestamptz`
- `favorite_lead_by uuid` (no FK to `auth.users` — convention in this project)

**`profiles`** (for customer favorites):
- `is_favorite_customer boolean NOT NULL DEFAULT false`
- `favorite_customer_at timestamptz`
- `favorite_customer_by uuid`
- `favorite_customer_note text`

Indexes: partial indexes on `is_favorite_lead` and `is_favorite_customer` where true.

### Security
Direct UPDATE is gated by existing admin RLS policies on both tables, BUT the `profiles` "Users can update their own profiles" policy currently only locks a fixed set of fields via `get_own_profile_protected_fields`. To prevent a user from toggling their own `is_favorite_customer`, we expose favorites only through an admin RPC and do **not** rely on the user-update policy:

```
toggle_favorite_conversation(p_conversation_id uuid, p_favorite boolean, p_note text default null)
  -> SECURITY DEFINER
  -> requires has_role(auth.uid(),'admin')
  -> if conversation.customer_id IS NOT NULL: update profiles row
  -> else: update conversations row (lead)
  -> returns jsonb { kind: 'customer'|'lead', favorited: bool }
```

Visitor→user linking (`linkVisitorConversation` in AuthContext): when a visitor conversation that was a favorite lead becomes linked to a customer, migrate the flag — extend the linker (or add a trigger on `conversations` UPDATE of `customer_id`) to copy `is_favorite_lead`/`favorite_lead_at` into the matching profile's `is_favorite_customer` if not already set, then clear the lead flag.

### UI (in `src/components/dashboard/ChatAdmin.tsx`)
- Star icon button on each conversation card (right side, near the `ai`/`human` badge) and in the conversation header.
- Tooltip text varies by `customer_id` presence ("Favorite Customer" vs "Favorite Lead").
- Small "★ Favorite" badge inline with name when active.
- Add a **Favorites** chip alongside `All / Visitors / Users` filter tabs.
- Calls `supabase.rpc('toggle_favorite_conversation', …)` with optimistic update + toast.
- For customer conversations, fetch `profiles.is_favorite_customer` joined alongside the conversation list (single query addition).

---

## Part 2 — Archive Visitor Conversations

### Schema changes
**`conversations`**:
- `archived_at timestamptz`
- `archived_by uuid`
- `archive_reason text`
- `archive_batch_id uuid`
- Index on `archived_at` (partial: where null).

No changes to `messages` — they remain intact.

### RPCs (SECURITY DEFINER, admin-only)

```
preview_archive_visitor_conversations(p_older_than_days int)
  returns jsonb {
    affected_count, messages_preserved, oldest, newest,
    excluded_favorites, excluded_user_linked, excluded_human_mode, excluded_with_contact
  }

archive_visitor_conversations(
  p_older_than_days int,
  p_exclude_favorites bool default true,
  p_exclude_user_linked bool default true,
  p_exclude_with_contact bool default true,
  p_exclude_human_mode bool default true,
  p_reason text default null
) returns jsonb { batch_id, archived_count }

restore_archived_conversations(p_conversation_ids uuid[]) returns jsonb { restored_count }
restore_archive_batch(p_batch_id uuid) returns jsonb { restored_count }
```

Filter rules in archive:
- `customer_id IS NULL` (visitor-only) — hard requirement, never archive linked
- `archived_at IS NULL`
- `created_at < now() - (p_older_than_days || ' days')::interval` (or skip if `p_older_than_days = 0` for "all time")
- `mode != 'human'` when exclude_human_mode
- `is_favorite_lead = false` when exclude_favorites
- `user_email IS NULL AND user_name IS NULL` when exclude_with_contact (these are the captured contact fields on conversations)

Archive only sets the four columns + a shared `archive_batch_id`. No deletes, no message changes, no message inserts (so no webhook trigger fires).

### UI changes (`ChatAdmin.tsx`)

1. **Active/Archived/All filter** — segmented control above the existing All/Visitors/Users tabs. Default = Active. Conversations query adds `.is('archived_at', null)` for Active, `.not('archived_at','is',null)` for Archived.
2. **Active count badge** excludes archived.
3. **"Clean Up" button** in the conversation list header — opens an AlertDialog:
   - Title: "Clean Up Visitor Conversations"
   - Scope (locked, info-only): "Visitors only"
   - Range select: 7 / 30 (default) / 90 / All time
   - Checkboxes (all checked by default): Exclude favorite leads, Exclude user-linked, Exclude with contact info, Exclude human-mode
   - Optional reason text
   - **Preview button** → calls `preview_archive_visitor_conversations` → renders the counts/date range and warnings
   - **Archive button** (disabled until preview) → calls `archive_visitor_conversations`, shows toast with batch_id and count, refreshes list
4. **Restore action** on archived conversation cards — small "Restore" button visible only when filter = Archived. Calls `restore_archived_conversations([id])`.

### Realtime / n8n safety
- Archive only updates `conversations` — no rows inserted into `messages`, so `emit_message_webhook` (only fires on `messages` insert) never runs.
- Existing realtime subscriptions on `messages` and `conversations` are unaffected; archived rows simply drop out of the active list filter.
- Visitor chat edge function (`visitor-chat`) finds conversations by `visitor_id` regardless of `archived_at`. If an archived visitor returns and sends a new message, we should auto-unarchive on new user message. Implement via a trigger on `messages` AFTER INSERT WHEN role='user': `UPDATE conversations SET archived_at=NULL, archived_by=NULL, archive_reason=NULL WHERE id=NEW.conversation_id AND archived_at IS NOT NULL`. This preserves UX continuity without breaking history.

---

## Files touched
- **Migration** (single file): all schema columns + indexes + 4 RPCs + auto-unarchive trigger.
- `src/components/dashboard/ChatAdmin.tsx`: filters, star button, Clean Up modal, restore action, query updates.
- `src/contexts/AuthContext.tsx` (`linkVisitorConversation`): migrate `is_favorite_lead` → `is_favorite_customer` when linking.
- `src/integrations/supabase/types.ts` regenerates automatically.

## Risk analysis
- **No data loss**: archive is reversible; restore RPCs provided; messages untouched.
- **RLS unchanged** for non-admins; favorites flow through SECURITY DEFINER RPC with explicit `has_role` check, so users cannot self-favorite.
- **Webhook safety**: archive path performs only `UPDATE conversations`; `emit_message_webhook` is on `messages` only.
- **Realtime safety**: subscriptions still receive events; filter is purely presentational on the list.
- **Edge case**: archived visitor returning → auto-unarchive trigger keeps conversations alive. Documented in trigger comment.
- **Edge case**: visitor→user linking → favorite migrates so admins don't lose the marker.
