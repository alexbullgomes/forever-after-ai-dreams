
# Unified Chat System Implementation Plan

## Executive Summary
This plan unifies the visitor (unauthenticated) and user (authenticated) chat systems under a single conversation management structure. Visitors will have persistent conversations stored in Supabase, visible and manageable in the Admin Dashboard alongside authenticated users - all without requiring login.

---

## Phase 1: Database Schema Updates

### 1.1 Modify `conversations` Table

Add a nullable `visitor_id` column to support both users and visitors:

```sql
-- Add visitor_id column (nullable)
ALTER TABLE public.conversations 
ADD COLUMN visitor_id TEXT;

-- Make customer_id nullable (currently NOT NULL)
ALTER TABLE public.conversations 
ALTER COLUMN customer_id DROP NOT NULL;

-- Add check constraint: exactly one of customer_id or visitor_id must be set
ALTER TABLE public.conversations 
ADD CONSTRAINT conversations_owner_check 
CHECK (
  (customer_id IS NOT NULL AND visitor_id IS NULL) OR 
  (customer_id IS NULL AND visitor_id IS NOT NULL)
);

-- Create index for visitor_id lookups
CREATE INDEX idx_conversations_visitor_id ON public.conversations(visitor_id) 
WHERE visitor_id IS NOT NULL;
```

### 1.2 Update RLS Policies for `conversations`

Modify policies to allow visitor access:

```sql
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Deny unauthenticated access to conversations" ON public.conversations;

-- New: Visitors can create their own conversations
CREATE POLICY "Visitors can create their own conversations" 
ON public.conversations FOR INSERT 
TO anon
WITH CHECK (visitor_id IS NOT NULL AND customer_id IS NULL);

-- New: Visitors can view their own conversations (via edge function)
-- Note: We'll use edge functions with service role for visitor operations
CREATE POLICY "Service role full access to conversations"
ON public.conversations FOR ALL
USING (auth.role() = 'service_role');
```

### 1.3 Update RLS Policies for `messages`

```sql
-- Drop existing restrictive policy  
DROP POLICY IF EXISTS "Deny unauthenticated access to messages" ON public.messages;

-- New: Allow service role full access for edge functions
CREATE POLICY "Service role full access to messages"
ON public.messages FOR ALL
USING (auth.role() = 'service_role');
```

---

## Phase 2: Create Visitor Chat Edge Function

### 2.1 New Edge Function: `visitor-chat`

Create `supabase/functions/visitor-chat/index.ts` to handle visitor message persistence:

**Responsibilities:**
1. Create or retrieve conversation by `visitor_id`
2. Insert visitor message into `messages` table
3. Forward message to n8n webhook (if in AI mode)
4. Insert AI response back into `messages` table
5. Return conversation_id for real-time subscription

**API Contract:**
```typescript
// Request
POST /functions/v1/visitor-chat
{
  action: 'send_message' | 'get_conversation' | 'get_messages',
  visitor_id: string,
  content?: string,
  type?: 'text' | 'audio',
  audio_url?: string
}

// Response
{
  success: boolean,
  conversation_id: string,
  message_id?: number,
  ai_response?: string,
  messages?: Message[]
}
```

**Key Logic:**
- Create conversation with `visitor_id` set, `customer_id` null
- Set `user_name` to "Visitor" or derive from visitor metadata
- Set `mode` to 'ai' by default
- Check conversation mode before forwarding to n8n
- If mode is 'human', skip n8n and wait for admin reply

---

## Phase 3: Update Visitor Chat Component

### 3.1 Refactor `expandable-chat-webhook.tsx`

Transform from webhook-only to Supabase-persisted:

**Changes:**
1. Remove direct webhook communication
2. Call new `visitor-chat` edge function instead
3. Add real-time subscription to messages table
4. Load existing conversation/messages on mount
5. Store `conversation_id` in component state

**New Flow:**
```text
1. Component mounts
2. Get visitor_id from localStorage
3. Call visitor-chat edge function with action: 'get_conversation'
4. If conversation exists, load messages and subscribe
5. If not, show intro message (not persisted)
6. On first user message, create conversation
7. Subscribe to Supabase Realtime for new messages
```

**Component Structure Updates:**
```typescript
// New state
const [conversationId, setConversationId] = useState<string | null>(null);
const [conversationMode, setConversationMode] = useState<'ai' | 'human'>('ai');

// New effect: Initialize conversation
useEffect(() => {
  const initVisitorChat = async () => {
    const visitorId = getOrCreateVisitorId();
    setVisitorId(visitorId);
    
    const response = await fetch('/functions/v1/visitor-chat', {
      method: 'POST',
      body: JSON.stringify({
        action: 'get_conversation',
        visitor_id: visitorId
      })
    });
    
    if (response.ok) {
      const { conversation_id, messages } = await response.json();
      if (conversation_id) {
        setConversationId(conversation_id);
        setMessages(convertMessages(messages));
        subscribeToMessages(conversation_id);
      }
    }
  };
  initVisitorChat();
}, []);

// New: Real-time subscription
const subscribeToMessages = (convId: string) => {
  const channel = supabase
    .channel(`visitor-messages-${convId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${convId}`
    }, (payload) => {
      // Add new message from admin/AI to UI
      if (payload.new.role !== 'user') {
        addMessageToUI(payload.new);
      }
    })
    .subscribe();
};
```

---

## Phase 4: Update Admin Dashboard

### 4.1 Modify `ChatAdmin.tsx`

**Display Visitor Conversations:**
- Fetch conversations regardless of whether `customer_id` or `visitor_id` is set
- Show "Visitor" label for conversations with `visitor_id`
- Display visitor metadata if available from `visitors` table

**Updates to Conversation Interface:**
```typescript
interface Conversation {
  id: string;
  customer_id: string | null;  // Now nullable
  visitor_id: string | null;   // New field
  user_name: string | null;
  user_email: string | null;
  mode: string;
  // ... existing fields
}
```

**Updates to fetchConversations:**
```typescript
const fetchConversations = async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      messages!inner(count),
      visitors:visitor_id(device_type, browser, first_landing_url)
    `)
    .order('created_at', { ascending: false });
  // ... process with visitor label
};
```

**Visual Differentiation:**
- Add "Visitor" badge for visitor conversations
- Show device/browser info from visitors table
- Different avatar icon (e.g., User icon vs UserCircle)

### 4.2 Update UserProfileModal

- Handle case where `customer_id` is null (visitor)
- Show visitor metadata instead of profile data
- Display visit history from `visitor_events` table

---

## Phase 5: Visitor → User Linking

### 5.1 Link Conversation on Login

When a visitor logs in, link their conversation to their user profile:

**In AuthContext or login handler:**
```typescript
const linkVisitorConversation = async (userId: string) => {
  const visitorId = getVisitorId();
  if (!visitorId) return;
  
  // Update conversation to link to user
  await supabase
    .from('conversations')
    .update({ 
      customer_id: userId, 
      visitor_id: null  // Clear visitor_id after linking
    })
    .eq('visitor_id', visitorId);
    
  // Also link the visitor record
  await linkVisitorToUser(userId);
};
```

This ensures:
- Conversation history transfers to the user
- No data loss on login
- Admin sees continuous conversation thread

---

## Phase 6: Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/visitor-chat/index.ts` | Edge function for visitor chat persistence |
| `supabase/migrations/XXXXX_add_visitor_chat_support.sql` | Database schema changes |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/ui/expandable-chat-webhook.tsx` | Switch to Supabase persistence, add real-time subscription |
| `src/components/dashboard/ChatAdmin.tsx` | Display visitor conversations, add visitor badges |
| `src/components/dashboard/UserProfileModal.tsx` | Handle visitor profiles |
| `src/contexts/AuthContext.tsx` | Link visitor conversation on login |
| `src/integrations/supabase/types.ts` | Update types for conversations table |

---

## Technical Details

### Edge Function: visitor-chat

```typescript
// Core logic outline
serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { action, visitor_id, content, type, audio_url } = await req.json();

  switch (action) {
    case 'get_conversation': {
      // Find existing conversation by visitor_id
      const { data: conversation } = await supabase
        .from('conversations')
        .select('*, messages(*)') 
        .eq('visitor_id', visitor_id)
        .single();
      
      return Response.json({ 
        conversation_id: conversation?.id,
        messages: conversation?.messages || [],
        mode: conversation?.mode || 'ai'
      });
    }
    
    case 'send_message': {
      // Get or create conversation
      let conversationId = await getOrCreateConversation(visitor_id);
      
      // Insert user message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        type: type || 'text',
        content,
        audio_url,
        user_name: 'Visitor'
      });
      
      // Check mode
      const { data: conv } = await supabase
        .from('conversations')
        .select('mode')
        .eq('id', conversationId)
        .single();
      
      // If AI mode, forward to n8n and store response
      if (conv.mode === 'ai') {
        const aiResponse = await forwardToN8N(content, visitor_id);
        
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'ai',
          type: 'text',
          content: aiResponse
        });
        
        return Response.json({ 
          success: true,
          conversation_id: conversationId,
          ai_response: aiResponse
        });
      }
      
      // Human mode - just confirm message saved
      return Response.json({ 
        success: true,
        conversation_id: conversationId
      });
    }
  }
});
```

### Real-time Subscription Security

For visitors to receive real-time updates without authentication:
- Use Supabase public anon key for subscriptions
- Filter subscription by specific `conversation_id` 
- Visitor only receives messages for their own conversation

```sql
-- Enable realtime on messages table (if not already)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## Testing Checklist

1. **Visitor sends first message:**
   - Conversation created in database
   - Message persisted
   - AI response received and stored
   - Real-time subscription active

2. **Visitor returns to site:**
   - Existing conversation loaded
   - Message history displayed
   - Real-time subscription resumes

3. **Admin views visitor in Chat Admin:**
   - Visitor conversation appears in list
   - "Visitor" badge displayed
   - Can switch to Human mode
   - Can send messages

4. **Admin takeover:**
   - Toggle to Human mode
   - AI responses disabled
   - Admin messages reach visitor in real-time
   - Visitor can continue conversation

5. **Visitor logs in:**
   - Conversation linked to user profile
   - History preserved
   - Switches to authenticated chat UI
   - Admin sees continuous thread

6. **No regressions:**
   - Authenticated chat works identically
   - Existing conversations unaffected
   - Card messages work for both

---

## Security Considerations

1. **Visitor Identification:**
   - `visitor_id` is a UUID stored in localStorage
   - Cannot be forged to access other conversations
   - Edge function validates visitor_id format

2. **RLS Protection:**
   - Service role used for edge function operations
   - Visitors cannot directly query conversations/messages
   - All visitor operations go through edge function

3. **Rate Limiting:**
   - Apply rate limits in edge function
   - Prevent spam from unauthenticated users
   - Same limits as current webhook proxy

4. **Data Privacy:**
   - Visitor messages stored with minimal PII
   - No email required for visitors
   - Conversations can be purged after inactivity period

---

## Summary

This implementation creates a unified chat system where:
- Both visitors and users have persistent conversations
- Both appear in the same Admin Dashboard
- Same AI/Human mode toggle works for both
- Same real-time updates for both
- Visitor history transfers on login
- No authentication required for visitors
- Existing authenticated chat unchanged
