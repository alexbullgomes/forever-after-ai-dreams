

# Add Visual Filter to Chat Admin Conversation List

## Overview

Add a segmented filter control to the Chat Admin conversation list that allows switching between All, Visitors (unauthenticated guests), and Logged-in Users. This is a frontend-only filter using existing conversation data.

## UI Design

The filter will be placed below the "Active Conversations" header, styled as a segmented button group (similar to tabs):

```text
+--------------------------------------------------+
|  Active Conversations     26                      |
|  +------------------------------------------+    |
|  |  All (26)  |  Visitors (12)  |  Users (14) |  |
|  +------------------------------------------+    |
+--------------------------------------------------+
```

## Technical Approach

### File to Modify
`src/components/dashboard/ChatAdmin.tsx`

### Changes Required

1. **Add Filter State** (after line 62):
   ```typescript
   const [conversationFilter, setConversationFilter] = useState<'all' | 'visitor' | 'user'>('all');
   ```

2. **Create Computed Filtered List** (before the return statement):
   ```typescript
   const filteredConversations = conversations.filter((conv) => {
     if (conversationFilter === 'all') return true;
     const isVisitor = !conv.customer_id && !!conv.visitor_id;
     if (conversationFilter === 'visitor') return isVisitor;
     if (conversationFilter === 'user') return !isVisitor;
     return true;
   });
   
   // Counts for badges
   const visitorCount = conversations.filter(c => !c.customer_id && !!c.visitor_id).length;
   const userCount = conversations.filter(c => !!c.customer_id).length;
   ```

3. **Add Filter UI** (after line 455, below the header):
   ```typescript
   <div className="flex items-center gap-1 mt-3">
     <Button
       variant={conversationFilter === 'all' ? 'default' : 'outline'}
       size="sm"
       onClick={() => setConversationFilter('all')}
       className="flex-1 text-xs"
     >
       All ({conversations.length})
     </Button>
     <Button
       variant={conversationFilter === 'visitor' ? 'default' : 'outline'}
       size="sm"
       onClick={() => setConversationFilter('visitor')}
       className="flex-1 text-xs"
     >
       Visitors ({visitorCount})
     </Button>
     <Button
       variant={conversationFilter === 'user' ? 'default' : 'outline'}
       size="sm"
       onClick={() => setConversationFilter('user')}
       className="flex-1 text-xs"
     >
       Users ({userCount})
     </Button>
   </div>
   ```

4. **Update Conversation Mapping** (line 460):
   Replace `conversations.map((conversation)` with `filteredConversations.map((conversation)`

5. **Update Empty State** (line 525):
   Update the empty state message to reflect filtered state:
   ```typescript
   {filteredConversations.length === 0 && (
     <div className="text-center py-8 text-gray-500">
       {conversationFilter === 'all' 
         ? 'No conversations found' 
         : `No ${conversationFilter === 'visitor' ? 'visitor' : 'user'} conversations`}
     </div>
   )}
   ```

6. **Update Active Count Badge** (line 454):
   Change to show filtered count: `<Badge variant="secondary">{filteredConversations.length}</Badge>`

## Data Flow

```text
conversations (full list from DB)
        │
        ▼
conversationFilter state ('all' | 'visitor' | 'user')
        │
        ▼
filteredConversations (computed array)
        │
        ├──► Rendered in list
        └──► Count shown in badge
```

## Filter Logic

| Filter | Condition |
|--------|-----------|
| All | No filter - show all conversations |
| Visitors | `!customer_id && !!visitor_id` (unauthenticated guests) |
| Users | `!!customer_id` (authenticated users) |

## What Stays Unchanged

- Database queries (no changes to `fetchConversations`)
- Realtime subscriptions and polling
- AI/Human mode toggle behavior
- Message sending/receiving logic
- Webhook integrations
- Conversation selection behavior
- Unread indicator logic

## Testing Checklist

1. Filter defaults to "All" showing all conversations
2. Clicking "Visitors" shows only guest conversations (gray avatar, "Guest" badge)
3. Clicking "Users" shows only authenticated user conversations (rose avatar, name/email)
4. Counts in filter buttons are accurate
5. Badge next to header updates with filtered count
6. Empty state shows appropriate message per filter
7. Selecting a conversation still works in all filter modes
8. AI/Human mode toggle still works
9. Sending messages still works
10. New messages appear in correct filter view

