

# Open Conversation from User Profile Modal

## Summary
Add an "Open Conversation" button to the UserProfileModal and update ChatAdmin to accept a `conversationId` query parameter for auto-selection.

## Changes

### 1. `src/components/dashboard/UserProfileModal.tsx`
- Import `useNavigate` from react-router-dom and `MessageCircle` icon
- Add an `openConversation` async handler that:
  1. Queries `conversations` where `customer_id = profile.id`, ordered by `created_at DESC`, limit 1
  2. If not found and `profile.visitor_id` exists, queries `conversations` where `visitor_id = profile.visitor_id`, ordered by `created_at DESC`, limit 1
  3. If found: `navigate(/dashboard/chat?conversationId=${id})` and close modal
  4. If not found: show toast "No conversation found for this user"
- Render a `MessageCircle` button in the DialogHeader area (next to the profile name/badge), with tooltip "Open Conversation"

### 2. `src/components/dashboard/ChatAdmin.tsx`
- Import `useSearchParams` from react-router-dom
- After conversations are fetched, check for `conversationId` query param
- If present and conversations are loaded, find the matching conversation and call `setSelectedConversation(match)`
- Clear the param after auto-selecting (to avoid re-triggering on refresh)
- This runs once via a `useEffect` that depends on `[conversations, searchParams]` with a ref guard to prevent repeated selection

### 3. No other files changed
- No database changes
- No chat logic changes
- No edge function changes

## Technical Detail

**Conversation lookup query (UserProfileModal):**
```typescript
// Priority 1: by customer_id
let { data } = await supabase
  .from('conversations')
  .select('id')
  .eq('customer_id', profile.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

// Priority 2: fallback by visitor_id
if (!data && profile.visitor_id) {
  ({ data } = await supabase
    .from('conversations')
    .select('id')
    .eq('visitor_id', profile.visitor_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle());
}
```

**ChatAdmin auto-open (one-shot effect):**
```typescript
const [searchParams, setSearchParams] = useSearchParams();

useEffect(() => {
  const targetId = searchParams.get('conversationId');
  if (!targetId || conversations.length === 0) return;
  const match = conversations.find(c => c.id === targetId);
  if (match) {
    setSelectedConversation(match);
    setSearchParams(prev => { prev.delete('conversationId'); return prev; }, { replace: true });
  }
}, [conversations]);
```

