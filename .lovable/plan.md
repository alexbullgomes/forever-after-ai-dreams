

# Align Visitor Chat Real-time Subscription with Authenticated Chat

## Summary

Update the Visitor Expandable Chat (`expandable-chat-webhook.tsx`) to use the same real-time message subscription pattern as the Authenticated Expandable Chat (`expandable-chat-assistant.tsx`). This is a logic-only change with no modifications to UI, layout, design, database, or existing behavior.

## Problem Analysis

The authenticated chat uses a declarative `useEffect` that automatically manages the Supabase real-time subscription whenever `conversationId` changes:

```typescript
// Authenticated Chat (current pattern - reliable)
useEffect(() => {
  if (!conversationId) return;
  
  const channel = supabase.channel('messages')
    .on('postgres_changes', {...})
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
}, [conversationId]);
```

The visitor chat uses an imperative callback approach that can miss subscription updates:

```typescript
// Visitor Chat (current pattern - less reliable)
const subscribeToMessages = useCallback((convId) => {...}, []);

// Called manually in multiple places:
// - Inside initVisitorChat() 
// - Inside handleSubmit() after first message
```

## Solution

Refactor the visitor chat to match the authenticated chat's declarative pattern:

1. **Remove** the `subscribeToMessages` callback function
2. **Add** a `useEffect` that depends on `conversationId`
3. **Keep** the conversation update listener for mode changes
4. **Use** proper cleanup with `supabase.removeChannel()`

## Changes Required

**File: `src/components/ui/expandable-chat-webhook.tsx`**

### Change 1: Remove the subscribeToMessages callback (lines 84-139)

Delete the entire `subscribeToMessages` callback function since it will be replaced by a useEffect.

### Change 2: Add new useEffect for real-time subscription

Add a new `useEffect` that mirrors the authenticated chat pattern:

```typescript
// Set up real-time subscription when conversationId is available
useEffect(() => {
  if (!conversationId) return;

  console.log('[VisitorChat] Setting up subscription for:', conversationId);
  
  const channel = supabase
    .channel(`visitor-messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('[VisitorChat] Received new message:', payload.new);
        const newMsg = payload.new as any;
        
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
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`
      },
      (payload) => {
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

### Change 3: Update initialization useEffect (lines 141-206)

Remove the `subscribeToMessages` call from initialization - the new useEffect will handle it automatically when `conversationId` is set:

```typescript
useEffect(() => {
  const initVisitorChat = async () => {
    const storedVisitorId = getOrCreateVisitorId();
    setVisitorId(storedVisitorId);

    try {
      const response = await fetch(...);
      if (response.ok) {
        const data = await response.json();
        
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
          setConversationMode(data.mode || 'ai');
          
          if (data.messages && data.messages.length > 0) {
            const convertedMessages = data.messages.map(convertDbMessage);
            setMessages(convertedMessages);
          }
          // REMOVED: subscribeToMessages(data.conversation_id);
          // The new useEffect will auto-subscribe when conversationId is set
        } else {
          // Show intro message
        }
      }
    } catch (error) {
      // Error handling
    }
    setIsInitialized(true);
  };

  initVisitorChat();
  // REMOVED: cleanup function - now handled by subscription useEffect
}, []); // Remove subscribeToMessages from dependencies
```

### Change 4: Update handleSubmit (around line 248-251)

Remove the manual subscription call after first message:

```typescript
// Current code (lines 248-251):
if (data.conversation_id && !conversationId) {
  setConversationId(data.conversation_id);
  subscribeToMessages(data.conversation_id); // REMOVE this line
}

// Updated code:
if (data.conversation_id && !conversationId) {
  setConversationId(data.conversation_id);
  // Subscription will be handled automatically by useEffect
}
```

### Change 5: Update handleVoiceStop callback (around lines 339-342)

Remove the same manual subscription call:

```typescript
if (data.conversation_id && !conversationId) {
  setConversationId(data.conversation_id);
  // REMOVED: subscribeToMessages(data.conversation_id);
}
```

### Change 6: Remove subscriptionRef

Since we no longer need to track the subscription reference manually (the useEffect handles cleanup), remove:
- Line 69: `const subscriptionRef = useRef<...>(null);`

## Technical Notes

- **No UI changes**: The component renders exactly the same
- **No database changes**: Same tables and queries used
- **No behavior changes**: Messages still appear in real-time
- **Improved reliability**: Declarative subscription ensures it's always active when `conversationId` exists
- **Proper cleanup**: Using `supabase.removeChannel()` instead of `.unsubscribe()` matches best practices

## Files Modified

| File | Change Type |
|------|-------------|
| `src/components/ui/expandable-chat-webhook.tsx` | Logic refactor only |

## Testing Checklist

1. Open visitor chat (not logged in)
2. Send a message - verify AI response appears instantly
3. Have admin send a message via Chat Admin - verify it appears in visitor chat instantly
4. Switch conversation mode from AI to Human - verify status updates
5. Refresh page - verify conversation history loads and subscription reconnects
6. Verify no console errors related to subscriptions

