

# Unify Chat Architecture: Database-Driven Webhook Emission

## Overview

This plan transforms the chat architecture so that **the database becomes the single source of truth and event emitter**. All chat messages (visitor and authenticated) will be inserted directly into the `messages` table, and a database trigger will emit webhooks to n8n.

## Current Architecture Analysis

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CURRENT ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AUTHENTICATED USER:                                                        │
│  ──────────────────                                                         │
│  Frontend → INSERT into messages → Real-time subscription → AI response     │
│                                                                             │
│  ❌ No webhook triggered                                                    │
│  ❌ n8n has no visibility into authenticated messages                       │
│                                                                             │
│  VISITOR:                                                                   │
│  ────────                                                                   │
│  Frontend → visitor-chat Edge Function → INSERT + n8n webhook call          │
│                                                                             │
│  ⚠️  Webhook triggered from edge function (not database)                   │
│  ⚠️  Different payload structure than authenticated messages               │
│  ⚠️  Audio upload handled in edge function                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Visitor Webhook Payload (Different from DB Schema)

```json
{
  "message": "Hello",
  "visitorId": "abc123",
  "conversationId": "uuid",
  "messageType": "text",
  "audioUrl": null,
  "timestamp": "2026-01-24T..."
}
```

---

## Target Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TARGET ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BOTH VISITOR + AUTHENTICATED:                                             │
│  ─────────────────────────────                                              │
│  Frontend → INSERT into messages → Database Trigger → Webhook to n8n       │
│                                                                             │
│  ✅ Single source of truth (messages table)                                │
│  ✅ Unified payload structure mirroring database schema                    │
│  ✅ No webhook logic in frontend or edge functions                         │
│  ✅ n8n receives identical payloads for both user types                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Unified Webhook Payload (Mirrors messages table)

```json
{
  "source": "visitor",
  "message": {
    "id": 12345,
    "conversation_id": "uuid",
    "role": "user",
    "type": "text",
    "content": "Hello",
    "audio_url": null,
    "created_at": "2026-01-24T...",
    "user_name": "Visitor",
    "user_email": null
  },
  "user_id": null,
  "visitor_id": "abc123",
  "conversation": {
    "id": "uuid",
    "mode": "ai"
  }
}
```

---

## Implementation Steps

### Step 1: Create Database Trigger Function

Create a PostgreSQL function that fires on INSERT to the `messages` table and calls the n8n webhook via `net.http_post`.

**SQL Migration:**

```sql
-- Create function to emit unified webhook on message insert
CREATE OR REPLACE FUNCTION emit_message_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conv_record RECORD;
  source_type TEXT;
  user_id UUID;
  visitor_id TEXT;
  webhook_url TEXT := 'https://agcreationmkt.cloud/webhook/79834679-8b0e-4dfb-9fbe-408593849da1';
  payload JSONB;
BEGIN
  -- Only emit for user messages (not AI/human responses)
  IF NEW.role != 'user' THEN
    RETURN NEW;
  END IF;

  -- Get conversation details
  SELECT id, mode, customer_id, visitor_id 
  INTO conv_record
  FROM conversations 
  WHERE id = NEW.conversation_id;

  IF conv_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine source type and IDs
  IF conv_record.customer_id IS NOT NULL THEN
    source_type := 'authenticated';
    user_id := conv_record.customer_id::UUID;
    visitor_id := NULL;
  ELSE
    source_type := 'visitor';
    user_id := NULL;
    visitor_id := conv_record.visitor_id;
  END IF;

  -- Build unified payload
  payload := jsonb_build_object(
    'source', source_type,
    'message', jsonb_build_object(
      'id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'role', NEW.role,
      'type', NEW.type,
      'content', NEW.content,
      'audio_url', NEW.audio_url,
      'created_at', NEW.created_at,
      'user_name', NEW.user_name,
      'user_email', NEW.user_email
    ),
    'user_id', user_id,
    'visitor_id', visitor_id,
    'conversation', jsonb_build_object(
      'id', conv_record.id,
      'mode', conv_record.mode
    )
  );

  -- Send async webhook via pg_net
  PERFORM net.http_post(
    url := webhook_url,
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS trigger_emit_message_webhook ON messages;
CREATE TRIGGER trigger_emit_message_webhook
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION emit_message_webhook();
```

---

### Step 2: Update Visitor Chat Flow

Modify `expandable-chat-webhook.tsx` to:
1. Remove n8n webhook logic
2. Insert directly into database (via simplified edge function)
3. Let database trigger handle webhook emission

**Changes to `visitor-chat` edge function:**
- Remove the n8n webhook call block (lines 267-340)
- Keep audio upload logic
- Keep conversation creation logic
- Return immediately after message insert (let trigger handle webhook)

**New visitor-chat flow:**
```
Frontend → visitor-chat Edge Function → INSERT message → Database Trigger → n8n
```

---

### Step 3: Add Webhook Callback for AI Responses

Create a new edge function `chat-webhook-callback` that n8n will call to insert AI responses.

**Edge Function: `chat-webhook-callback/index.ts`**

```typescript
// n8n calls this endpoint to insert AI response
serve(async (req) => {
  const { conversation_id, content, type } = await req.json();
  
  await supabase.from('messages').insert({
    conversation_id,
    role: 'ai',
    type: type || 'text',
    content,
    user_name: 'EVA'
  });
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

### Step 4: Update Authenticated Chat (Optional Enhancement)

The authenticated chat already inserts directly into the database. With the new trigger, it will automatically emit webhooks without any code changes.

**No changes required** - the trigger handles this automatically.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/[new].sql` | Create `emit_message_webhook` function and trigger |
| `supabase/functions/visitor-chat/index.ts` | Remove n8n webhook call, keep audio upload |
| `supabase/functions/chat-webhook-callback/index.ts` | NEW - endpoint for n8n to insert AI responses |
| `supabase/config.toml` | Add new edge function entry |

---

## Architecture Comparison

| Aspect | Current | After Fix |
|--------|---------|-----------|
| Webhook source | Edge function (visitor) / None (auth) | Database trigger (both) |
| Payload format | Different per user type | Unified schema |
| Frontend webhook calls | Visitor chat | None |
| Source of truth | Mixed | Database only |
| n8n visibility | Partial (visitors only) | Complete (all messages) |

---

## Technical Details

### Why Database Triggers?

1. **Single source of truth**: All messages must pass through the database
2. **Consistency**: Same payload for all message types
3. **Decoupling**: Frontend/edge functions don't need webhook knowledge
4. **Reliability**: `pg_net` handles async HTTP in PostgreSQL
5. **Auditability**: Every message is tracked before webhook fires

### Conversation Identification

The `conversations` table has:
- `customer_id`: Set for authenticated users (UUID)
- `visitor_id`: Set for visitors (string)

The trigger uses this to determine `source` type:
```sql
IF conv_record.customer_id IS NOT NULL THEN
  source_type := 'authenticated';
ELSE
  source_type := 'visitor';
END IF;
```

### Audio Handling

Audio upload remains in the `visitor-chat` edge function because:
1. Visitors need service role key to bypass RLS
2. Base64 → Storage upload requires server-side processing
3. The `audio_url` is inserted into the message record
4. Database trigger includes `audio_url` in webhook payload

---

## n8n Workflow Update

n8n workflow must be updated to:

1. **Accept unified payload** - same structure for both user types
2. **Check `source` field** - to apply different logic if needed
3. **Use `conversation.mode`** - to skip AI response when mode is "human"
4. **Call callback endpoint** - to insert AI response after processing

**n8n Pseudocode:**
```
ON webhook receive:
  IF source == "visitor" OR source == "authenticated":
    IF conversation.mode == "ai":
      response = generateAIResponse(message.content)
      POST to /functions/v1/chat-webhook-callback {
        conversation_id: message.conversation_id,
        content: response
      }
```

---

## Non-Breaking Guarantees

| Component | Impact |
|-----------|--------|
| Authenticated chat | ✅ No changes - trigger handles automatically |
| Chat Admin | ✅ No changes - reads from messages table |
| AI/Human takeover | ✅ Preserved - mode checked in trigger |
| Real-time subscriptions | ✅ Preserved - Supabase realtime unchanged |
| Audio messages | ✅ Preserved - audio_url included in payload |

---

## Testing Checklist

1. Send text message as visitor → verify webhook receives payload with `source: "visitor"`
2. Send text message as authenticated user → verify webhook receives payload with `source: "authenticated"`
3. Send audio message as visitor → verify `audio_url` is included in payload
4. Toggle conversation to Human mode → verify n8n respects `conversation.mode`
5. Verify Chat Admin displays all messages correctly
6. Verify real-time updates still work for both user types

