
# Implement Polling Mechanism for Visitor Chat Messages

## Summary

Add a 7-second polling interval to the Visitor Expandable Chat that fetches new AI/Admin messages from the database, complementing the existing broadcast subscription as a reliable fallback.

## Why Polling Is Needed

The broadcast mechanism requires:
1. The edge function to successfully broadcast after inserting
2. Network connectivity at the exact moment of broadcast
3. The client to be actively subscribed

Polling provides a backup that ensures messages are eventually displayed even if broadcasts are missed.

## Implementation

### Single File Change: `src/components/ui/expandable-chat-webhook.tsx`

#### Add Polling useEffect

Insert a new `useEffect` after the existing broadcast subscription (around line 123) that:
1. Sets up a 7-second interval when `conversationId` exists and `isInitialized` is true
2. Calls the existing `visitor-chat` edge function with `action: 'get_messages'`
3. Compares fetched messages against current state and adds any missing ones
4. Cleans up the interval on unmount or when `conversationId` changes

```typescript
// Polling fallback: Fetch messages every 7 seconds to catch any missed broadcasts
useEffect(() => {
  if (!conversationId || !isInitialized) return;

  const pollMessages = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/visitor-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_messages',
          visitor_id: visitorId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.messages && data.messages.length > 0) {
          setMessages(prev => {
            // Get IDs of existing messages
            const existingIds = new Set(prev.map(m => m.id));
            
            // Find new messages not in current state
            const newMessages = data.messages
              .filter((m: any) => !existingIds.has(m.id?.toString()))
              .map(convertDbMessage);
            
            if (newMessages.length > 0) {
              console.log('[VisitorChat] Polling found new messages:', newMessages.length);
              return [...prev, ...newMessages];
            }
            return prev;
          });
        }
        
        // Also sync conversation mode
        if (data.mode && data.mode !== conversationMode) {
          setConversationMode(data.mode);
        }
      }
    } catch (error) {
      console.error('[VisitorChat] Polling error:', error);
    }
  };

  console.log('[VisitorChat] Starting 7-second polling for conversation:', conversationId);
  
  const intervalId = setInterval(pollMessages, 7000);

  return () => {
    console.log('[VisitorChat] Stopping polling');
    clearInterval(intervalId);
  };
}, [conversationId, isInitialized, visitorId]);
```

## Technical Details

| Aspect | Details |
|--------|---------|
| **Polling Interval** | 7 seconds |
| **Edge Function** | Uses existing `visitor-chat` with `action: 'get_messages'` |
| **Deduplication** | Checks message IDs before adding to prevent duplicates |
| **Dependencies** | `conversationId`, `isInitialized`, `visitorId` |
| **Mode Sync** | Also syncs conversation mode (AI/Human) during poll |
| **Cleanup** | `clearInterval` on unmount or dependency change |

## Why This Approach

1. **No UI changes** - Only adds logic, rendering remains identical
2. **Uses existing API** - Leverages the `get_messages` action already in the edge function
3. **Efficient deduplication** - Compares by ID to avoid duplicate messages
4. **Non-blocking** - Runs in background, doesn't affect user interactions
5. **Complementary** - Works alongside broadcast for maximum reliability
6. **Clean lifecycle** - Proper cleanup prevents memory leaks

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/expandable-chat-webhook.tsx` | Add polling useEffect (logic only) |

## Testing Checklist

1. Open visitor chat and send a message
2. Wait 7+ seconds - should see polling logs in console
3. Have admin send a message - should appear within 7 seconds max
4. Close chat - verify polling stops (cleanup logs)
5. Verify no duplicate messages appear
6. Verify authenticated chat is completely unchanged
