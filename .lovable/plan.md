
# Fix Visitor Chat Polling Duplication Bug

## Problem Identified

The screenshot shows the same user message "hello quero saber mais sobre o seviços de fotos" appearing twice, causing repeated AI responses. This happens due to an **ID mismatch** between locally-generated IDs and database IDs.

## Root Cause

### The Flow That Causes Duplication:

```text
1. User sends message
   └── handleSubmit creates message with LOCAL ID: "abc123"
   └── setMessages([...prev, { id: "abc123", content: "hello..." }])

2. Edge function saves to database
   └── Returns message_id: 42 (database ID)
   └── Frontend IGNORES this ID ❌

3. Polling runs (every 7 seconds)
   └── Fetches all messages from database
   └── User message has id: "42" (database ID)

4. Deduplication check fails
   └── existingIds = Set(["abc123"])
   └── Is "42" in existingIds? NO ❌
   └── Adds "duplicate" message with id: "42"

5. Result: Same message appears twice with different IDs
```

## Solution

### Fix 1: Update Local Message ID After Submission (Primary Fix)

When the edge function returns `message_id`, update the locally-created user message to use the database ID. This ensures polling deduplication works correctly.

**In `handleSubmit`** (around line 275-282):

```typescript
if (response.ok) {
  const data = await response.json();
  
  // Update user message with database ID for proper deduplication
  if (data.message_id) {
    setMessages(prev => prev.map(msg => 
      msg.id === userMessage.id 
        ? { ...msg, id: data.message_id.toString() }
        : msg
    ));
  }
  
  // Set conversation ID if this was first message
  if (data.conversation_id && !conversationId) {
    setConversationId(data.conversation_id);
  }
  // ... rest of logic
}
```

### Fix 2: Same Fix for Voice Messages

Apply identical logic in `handleVoiceStart` recorder.onstop (around line 371-373):

```typescript
if (data.message_id) {
  setMessages(prev => prev.map(msg => 
    msg.id === tempMessageId 
      ? { ...msg, id: data.message_id.toString() }
      : msg
  ));
}
```

### Fix 3: Add Content-Based Deduplication as Safety Net

In the polling logic, add secondary deduplication by checking content + sender:

```typescript
const pollMessages = async () => {
  // ... fetch logic ...
  
  if (data.messages && data.messages.length > 0) {
    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      
      // Also create content fingerprints for backup deduplication
      const existingContent = new Set(
        prev.map(m => `${m.sender}:${m.content?.substring(0, 50)}`)
      );
      
      const newMessages = data.messages
        .filter((m: any) => {
          // Primary: Check by ID
          if (existingIds.has(m.id?.toString())) return false;
          
          // Secondary: Check by content fingerprint (prevents content duplicates)
          const fingerprint = `${m.role === 'user' ? 'user' : 'assistant'}:${m.content?.substring(0, 50)}`;
          if (existingContent.has(fingerprint)) return false;
          
          return true;
        })
        .map(convertDbMessage);
      
      if (newMessages.length > 0) {
        console.log('[VisitorChat] Polling found new messages:', newMessages.length);
        return [...prev, ...newMessages];
      }
      return prev;
    });
  }
};
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/expandable-chat-webhook.tsx` | 1. Update user message ID after edge function response in `handleSubmit`<br>2. Update voice message ID after edge function response<br>3. Add content fingerprint deduplication in polling |

## Technical Details

| Aspect | Details |
|--------|---------|
| **Primary Fix** | Sync local message ID with database ID immediately after POST |
| **Backup Fix** | Content-based fingerprint deduplication in polling |
| **No Backend Changes** | All fixes are frontend-only as requested |
| **No UI Changes** | Logic-only modifications |

## Why This Works

1. **ID Sync**: After `handleSubmit`, the user message ID changes from `"abc123"` to `"42"` (matching database)
2. **Next Poll**: When polling fetches message with `id: "42"`, deduplication finds it already exists
3. **No Duplicate**: Message is correctly filtered out
4. **Safety Net**: Content fingerprint catches any edge cases where ID sync fails

## Testing Checklist

1. Send a message as visitor
2. Wait 7+ seconds for polling to run
3. Verify message appears only ONCE
4. Verify AI response appears only ONCE
5. Send multiple messages in quick succession
6. Verify no duplicates across all messages
7. Test voice messages for same behavior
