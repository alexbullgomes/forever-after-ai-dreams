

# Fix Chat Event Duplication

## Problem Summary

Every visitor message triggers **TWO webhook events** to the same n8n endpoint because there are two database triggers on the `messages` table:

| Trigger | Function | Issues |
|---------|----------|--------|
| `Everafter n8n` | `supabase_functions.http_request()` | Raw row data, no visitor_id |
| `trigger_emit_message_webhook` | `emit_message_webhook()` | Normalized payload with visitor_id from conversations |

Both send to `https://agcreationmkt.cloud/webhook/79834679-8b0e-4dfb-9fbe-408593849da1`.

## Root Cause

1. **Duplicate triggers** - Two triggers fire on every INSERT
2. **Missing column** - `messages` table lacks `visitor_id` column, so native trigger cannot include it
3. **Data lookup overhead** - Current `emit_message_webhook` must JOIN conversations to get visitor_id

## Solution

### Step 1: Remove Duplicate Trigger

Drop the `Everafter n8n` trigger that sends raw Supabase events.

```sql
DROP TRIGGER IF EXISTS "Everafter n8n" ON messages;
```

### Step 2: Add visitor_id Column to messages Table

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS visitor_id TEXT;
```

### Step 3: Update visitor-chat Edge Function

Modify the INSERT statement to include `visitor_id`:

**File: `supabase/functions/visitor-chat/index.ts`** (Line ~233-244)

```typescript
// Current INSERT
const { data: userMsg, error: insertError } = await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    role: 'user',
    type: type || 'text',
    content: content || null,
    audio_url: finalAudioUrl,
    user_name: 'Visitor',
    new_msg: 'unread'
  })

// Updated INSERT - add visitor_id
const { data: userMsg, error: insertError } = await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    visitor_id: visitor_id,  // <-- NEW
    role: 'user',
    type: type || 'text',
    content: content || null,
    audio_url: finalAudioUrl,
    user_name: 'Visitor',
    new_msg: 'unread'
  })
```

### Step 4: Update emit_message_webhook Function

Simplify the function to use `visitor_id` directly from the message row:

```sql
CREATE OR REPLACE FUNCTION public.emit_message_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conv_record RECORD;
  source_type TEXT;
  v_user_id UUID;
  v_visitor_id TEXT;
  webhook_url TEXT := 'https://agcreationmkt.cloud/webhook/79834679-8b0e-4dfb-9fbe-408593849da1';
  payload JSONB;
BEGIN
  -- Only emit for user messages (not AI/human responses)
  IF NEW.role != 'user' THEN
    RETURN NEW;
  END IF;

  -- Get conversation details for mode only
  SELECT id, mode, customer_id
  INTO conv_record
  FROM conversations 
  WHERE id = NEW.conversation_id;

  IF conv_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine source type - use visitor_id from message row directly
  IF NEW.visitor_id IS NOT NULL THEN
    source_type := 'visitor';
    v_user_id := NULL;
    v_visitor_id := NEW.visitor_id;
  ELSIF conv_record.customer_id IS NOT NULL THEN
    source_type := 'authenticated';
    v_user_id := conv_record.customer_id::UUID;
    v_visitor_id := NULL;
  ELSE
    -- Fallback: check conversations.visitor_id for legacy messages
    SELECT visitor_id INTO v_visitor_id 
    FROM conversations 
    WHERE id = NEW.conversation_id;
    
    source_type := CASE WHEN v_visitor_id IS NOT NULL THEN 'visitor' ELSE 'unknown' END;
    v_user_id := NULL;
  END IF;

  -- Build unified payload with visitor_id directly from message
  payload := jsonb_build_object(
    'source', source_type,
    'message', jsonb_build_object(
      'id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'visitor_id', NEW.visitor_id,  -- Include in message object
      'role', NEW.role,
      'type', NEW.type,
      'content', NEW.content,
      'audio_url', NEW.audio_url,
      'created_at', NEW.created_at,
      'user_name', NEW.user_name,
      'user_email', NEW.user_email
    ),
    'user_id', v_user_id,
    'visitor_id', v_visitor_id,
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
```

### Step 5: Update TypeScript Types

**File: `src/integrations/supabase/types.ts`**

Add `visitor_id` to the messages table type definition.

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Drop old trigger, add visitor_id column, update function |
| `supabase/functions/visitor-chat/index.ts` | Add visitor_id to INSERT |
| `src/integrations/supabase/types.ts` | Add visitor_id to messages type |

## Expected Result After Fix

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AFTER FIX                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Triggers on messages table:                                                │
│  ───────────────────────────                                                │
│  ✅ trigger_emit_message_webhook (ONLY trigger for webhooks)               │
│  ✅ trigger_update_conversation_on_new_message (keeps conversation fresh)  │
│  ❌ "Everafter n8n" - REMOVED                                              │
│                                                                             │
│  Message INSERT:                                                            │
│  ───────────────                                                            │
│  Visitor: { conversation_id, visitor_id, role, type, content, ... }        │
│  Auth:    { conversation_id, user_id, role, type, content, ... }           │
│                                                                             │
│  Webhook Payload (unified):                                                 │
│  ─────────────────────────                                                  │
│  {                                                                          │
│    source: "visitor" | "authenticated",                                     │
│    message: { id, conversation_id, visitor_id, role, type, content, ... }, │
│    visitor_id: "abc123" | null,                                             │
│    user_id: "uuid" | null,                                                  │
│    conversation: { id, mode }                                               │
│  }                                                                          │
│                                                                             │
│  Result:                                                                    │
│  ───────                                                                    │
│  ✅ ONE webhook per message                                                 │
│  ✅ visitor_id ALWAYS present for visitor messages                         │
│  ✅ Unified payload structure                                               │
│  ✅ Database is single source of truth                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Non-Breaking Guarantees

| Component | Status |
|-----------|--------|
| Authenticated chat | ✅ No changes - continues to work |
| Chat Admin | ✅ No changes - reads from messages table |
| AI/Human takeover | ✅ Preserved - mode from conversations |
| Real-time subscriptions | ✅ Unchanged |
| Existing messages | ✅ Backward compatible (visitor_id nullable) |

## SQL Migration Summary

```sql
-- 1. Remove duplicate trigger
DROP TRIGGER IF EXISTS "Everafter n8n" ON messages;

-- 2. Add visitor_id column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS visitor_id TEXT;

-- 3. Update emit_message_webhook function to use NEW.visitor_id
CREATE OR REPLACE FUNCTION public.emit_message_webhook() ...

-- 4. Backfill existing visitor messages (optional)
UPDATE messages m
SET visitor_id = c.visitor_id
FROM conversations c
WHERE m.conversation_id = c.id
  AND c.visitor_id IS NOT NULL
  AND m.visitor_id IS NULL;
```

