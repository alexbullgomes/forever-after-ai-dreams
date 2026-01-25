
# Fix Visitor Chat Real-time with Supabase Broadcast

## Problem Summary

The Visitor Expandable Chat cannot receive AI/Admin replies in real-time because:

1. **Supabase Realtime `postgres_changes` respects RLS policies**
2. The `messages` table has an explicit deny policy: `SELECT ... USING (false)` for `anon` role
3. Even though the subscription connects successfully (status: `SUBSCRIBED`), Supabase filters out ALL change events at the server level
4. Anonymous users cannot pass any RLS check without authentication

## Why RLS-Based Solution Is Complex

To use `postgres_changes` with RLS for visitors, we would need to:
1. Create a custom JWT token containing the `visitor_id`
2. Use `supabase.realtime.setAuth('custom-jwt')` to authenticate the subscription
3. Create RLS policies that extract `visitor_id` from the JWT claims
4. Sign JWTs server-side with the Supabase JWT secret

This approach is complex and requires managing custom JWT tokens for anonymous users.

## Recommended Solution: Supabase Broadcast

Use **Supabase Realtime Broadcast** instead of `postgres_changes`. Broadcast:
- Does NOT require RLS permissions
- Works with anonymous (anon) users
- Is designed for pub/sub messaging patterns
- Can be triggered from Edge Functions

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BROADCAST SOLUTION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Current Flow (broken):                                                     │
│  ─────────────────────                                                      │
│  1. n8n calls chat-webhook-callback                                         │
│  2. Edge function INSERTs AI message into messages table                    │
│  3. postgres_changes event emitted                                          │
│  4. ❌ RLS blocks event for anon users                                      │
│                                                                             │
│  New Flow (fixed):                                                          │
│  ─────────────────                                                          │
│  1. n8n calls chat-webhook-callback                                         │
│  2. Edge function INSERTs AI message into messages table                    │
│  3. Edge function BROADCASTS message to conversation channel                │
│  4. ✅ Client receives broadcast (no RLS check)                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation

### Step 1: Update chat-webhook-callback Edge Function

Modify the edge function to broadcast the AI message after inserting it into the database.

**File: `supabase/functions/chat-webhook-callback/index.ts`**

After successfully inserting the AI message, add broadcast logic:

```typescript
// After inserting the AI message successfully...

// Broadcast the message to the conversation channel
// This enables real-time updates for visitors who can't use postgres_changes due to RLS
const broadcastChannel = supabase.channel(`chat:${conversation_id}`);
await broadcastChannel.subscribe();
await broadcastChannel.send({
  type: 'broadcast',
  event: 'new_message',
  payload: {
    id: aiMessage.id,
    conversation_id: conversation_id,
    role: 'ai',
    type: type,
    content: content || null,
    audio_url: audio_url || null,
    user_name: user_name,
    created_at: aiMessage.created_at
  }
});
await supabase.removeChannel(broadcastChannel);
```

### Step 2: Update Visitor Chat Subscription

Change the visitor chat to listen for broadcast events instead of `postgres_changes`.

**File: `src/components/ui/expandable-chat-webhook.tsx`**

Replace the `postgres_changes` subscription with a broadcast listener:

```typescript
// Set up real-time subscription using Broadcast (bypasses RLS)
useEffect(() => {
  if (!conversationId) return;

  console.log('[VisitorChat] Setting up broadcast subscription for:', conversationId);
  
  const channel = supabase
    .channel(`chat:${conversationId}`)
    .on('broadcast', { event: 'new_message' }, (payload) => {
      console.log('[VisitorChat] Received broadcast message:', payload);
      const newMsg = payload.payload;
      
      // Only add messages from non-user (AI or human admin)
      if (newMsg.role !== 'user') {
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(m => m.id === newMsg.id?.toString())) {
            return prev;
          }
          return [...prev, convertDbMessage(newMsg)];
        });
      }
    })
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`
      },
      (payload) => {
        // Conversation mode updates still work via postgres_changes
        // because we'll add an RLS policy for this
        console.log('[VisitorChat] Conversation updated:', payload.new);
        const updated = payload.new as any;
        if (updated.mode) {
          setConversationMode(updated.mode as 'ai' | 'human');
        }
      }
    )
    .subscribe((status) => {
      console.log('[VisitorChat] Subscription status:', status);
    });

  return () => {
    console.log('[VisitorChat] Cleaning up subscription');
    supabase.removeChannel(channel);
  };
}, [conversationId]);
```

### Step 3: Add RLS Policy for Conversations (Optional Enhancement)

To also enable real-time conversation mode updates for visitors, add an RLS policy:

```sql
-- Allow anonymous users to SELECT conversations matching their visitor_id
-- This enables postgres_changes for conversation mode updates
CREATE POLICY "Visitors can view their conversations"
ON public.conversations
FOR SELECT
TO anon
USING (visitor_id IS NOT NULL);
```

Note: This is a permissive policy. Since visitor_id is stored on the conversation and the filter `id=eq.${conversationId}` is applied client-side, this allows visitors to receive updates for any conversation with a visitor_id. For stricter security, we could skip this and handle mode changes via broadcast as well.

### Alternative Step 3: Broadcast Mode Changes Too

For maximum security, broadcast mode changes from the admin side too:

```sql
-- Create trigger to broadcast conversation mode changes
CREATE OR REPLACE FUNCTION broadcast_conversation_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.mode != OLD.mode THEN
    PERFORM net.http_post(
      url := 'https://hmdnronxajctsrlgrhey.supabase.co/functions/v1/broadcast-update',
      body := jsonb_build_object(
        'channel', 'chat:' || NEW.id,
        'event', 'mode_change',
        'payload', jsonb_build_object('mode', NEW.mode)
      ),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;
```

However, this adds complexity. The simpler approach is the RLS policy above.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/chat-webhook-callback/index.ts` | Add broadcast after INSERT |
| `src/components/ui/expandable-chat-webhook.tsx` | Switch to broadcast listener for messages |
| `supabase/migrations/[new].sql` | Add RLS policy for conversations (optional) |

## Technical Notes

- **Broadcast does not require RLS** - messages are pushed directly to subscribed clients
- **Authenticated chat unchanged** - continues using `postgres_changes` since it passes RLS
- **Database is still the source of truth** - messages are inserted then broadcast
- **Backward compatible** - page reload still fetches messages via Edge Function
- **Channel naming convention** - `chat:{conversation_id}` ensures proper routing

## Testing Checklist

1. Open visitor chat (not logged in)
2. Send a message - AI response should appear instantly via broadcast
3. Have admin switch conversation mode - visitor should see the update
4. Refresh page - all messages should load correctly
5. Open authenticated chat - verify it still works with postgres_changes

## Why This Is Better Than RLS Modification

| Approach | Pros | Cons |
|----------|------|------|
| **Broadcast** | Simple, no JWT complexity, secure | Requires Edge Function modification |
| **Custom JWT** | Uses native postgres_changes | Complex JWT management, security risk |
| **Permissive RLS** | Simple RLS policy | Exposes all visitor messages to any anon user |

Broadcast is the cleanest solution that maintains security while enabling real-time updates for anonymous visitors.
