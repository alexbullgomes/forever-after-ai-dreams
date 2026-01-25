

# Allow Product Cards for Visitors with Auth at Action Level

## Problem

The screenshot shows raw JSON being displayed in the Visitor Chat instead of a properly rendered product card. This happens because:

1. The Visitor Chat (`expandable-chat-webhook.tsx`) doesn't recognize or parse `card` type messages
2. It renders all messages as plain text: `<p>{message.content}</p>`
3. There's no `ChatCardMessage` component integration for visitors

## Solution

Update the Visitor Chat to render product/campaign cards identically to the authenticated chat, with authentication gating only at the CTA/booking action level (not at render time).

## Technical Changes

### File: `src/components/ui/expandable-chat-webhook.tsx`

#### 1. Update ChatMessage Interface (lines 27-35)

Add `type` and `cardData` fields to support card messages:

```typescript
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'audio' | 'card';  // ADD
  cardData?: CardMessageData;          // ADD
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}
```

#### 2. Update Imports (line 1-26)

Add necessary imports:

```typescript
import { ChatCardMessage } from "@/components/chat/ChatCardMessage";
import { CardMessageData } from "@/types/chat";
import { BookingFunnelModal } from "@/components/booking/BookingFunnelModal";
```

#### 3. Update convertDbMessage Function (lines 72-81)

Parse card data from content when message type is 'card':

```typescript
const convertDbMessage = (dbMsg: any): ChatMessage => {
  // Parse card data if type is 'card'
  let cardData: CardMessageData | undefined;
  if (dbMsg.type === 'card' && dbMsg.content) {
    try {
      cardData = JSON.parse(dbMsg.content);
    } catch (e) {
      console.error('[VisitorChat] Failed to parse card data:', e);
    }
  }

  return {
    id: dbMsg.id?.toString() || generateId(),
    content: dbMsg.content || '',
    sender: dbMsg.role === 'user' ? 'user' : 'assistant',
    timestamp: new Date(dbMsg.created_at),
    type: dbMsg.type || 'text',
    cardData,
    fileUrl: dbMsg.audio_url || undefined,
    fileType: dbMsg.audio_url ? 'audio/webm' : undefined,
    fileName: dbMsg.audio_url ? 'voice-message.webm' : undefined,
  };
};
```

#### 4. Add Booking State (after line 66)

Add state for managing product booking:

```typescript
const [bookingProduct, setBookingProduct] = useState<{
  id: string;
  title: string;
  price: number;
  currency: string;
} | null>(null);
```

#### 5. Add handleBookProduct Function (before renderMessage)

Create handler that gates authentication at action level:

```typescript
const handleBookProduct = (cardData: CardMessageData) => {
  if (cardData.entityType === 'product' && cardData.price !== undefined) {
    // For visitors, require login before booking
    if (!user) {
      // Store product info for after login, then show auth modal
      sessionStorage.setItem('pendingChatBooking', JSON.stringify({
        id: cardData.entityId,
        title: cardData.title,
        price: cardData.price,
        currency: cardData.currency || 'USD',
      }));
      setShowAuthModal(true);
      return;
    }
    
    // User is logged in, open booking modal
    setBookingProduct({
      id: cardData.entityId,
      title: cardData.title,
      price: cardData.price,
      currency: cardData.currency || 'USD',
    });
  }
};
```

#### 6. Update renderMessage Function (lines 503-555)

Add card rendering support:

```typescript
const renderMessage = (message: ChatMessage) => {
  const isUser = message.sender === 'user';
  
  // Special intro message
  if (message.content === "intro-with-login") {
    return (/* existing intro JSX */);
  }
  
  return (
    <ChatBubble key={message.id} variant={isUser ? "sent" : "received"}>
      {!isUser && (
        <ChatBubbleAvatar fallback="EVA" />
      )}
      <ChatBubbleMessage variant={isUser ? "sent" : "received"}>
        {/* Card message rendering */}
        {message.type === 'card' && message.cardData ? (
          <ChatCardMessage 
            data={message.cardData} 
            variant={isUser ? 'sent' : 'received'}
            onBookProduct={handleBookProduct}
          />
        ) : message.fileType?.startsWith('audio/') ? (
          /* existing audio JSX */
        ) : message.fileType?.startsWith('image/') ? (
          /* existing image JSX */
        ) : (
          <p>{message.content}</p>
        )}
      </ChatBubbleMessage>
    </ChatBubble>
  );
};
```

#### 7. Add BookingFunnelModal to JSX (after AuthModal, around line 642)

Add the booking modal component:

```typescript
{bookingProduct && (
  <BookingFunnelModal
    isOpen={!!bookingProduct}
    onClose={() => setBookingProduct(null)}
    productId={bookingProduct.id}
    productTitle={bookingProduct.title}
    productPrice={bookingProduct.price}
    currency={bookingProduct.currency}
  />
)}
```

#### 8. Resume Booking After Auth (in useEffect or after user login)

Check for pending chat booking after authentication:

```typescript
// Add useEffect to resume booking after login
useEffect(() => {
  if (user) {
    const pendingBooking = sessionStorage.getItem('pendingChatBooking');
    if (pendingBooking) {
      try {
        const bookingData = JSON.parse(pendingBooking);
        setBookingProduct(bookingData);
        sessionStorage.removeItem('pendingChatBooking');
      } catch (e) {
        console.error('[VisitorChat] Failed to parse pending booking:', e);
      }
    }
  }
}, [user]);
```

## Data Flow

```text
Admin sends product card → Stored as type='card' with JSON content
                               ↓
Visitor chat polls/receives message
                               ↓
convertDbMessage parses JSON to cardData
                               ↓
renderMessage checks type === 'card'
                               ↓
ChatCardMessage renders visual card
                               ↓
User clicks "Book Now" → handleBookProduct called
                               ↓
         ┌──────────────────────┴──────────────────────┐
         ↓                                             ↓
   User logged in?                              Not logged in
         ↓                                             ↓
   Open BookingFunnelModal                    Save to sessionStorage
                                                       ↓
                                              Open AuthModal
                                                       ↓
                                              After login, useEffect
                                              resumes with BookingFunnelModal
```

## Files Modified

| File | Changes |
|------|---------|
| `src/components/ui/expandable-chat-webhook.tsx` | Add card rendering, booking state, auth-gated booking handler |

## Key Benefits

1. **Unified Experience** - Product cards render identically for visitors and authenticated users
2. **Auth at Action Level** - Cards are always visible, authentication only required when booking
3. **Session Persistence** - Pending bookings are restored after login
4. **No Backend Changes** - All logic is frontend-only
5. **Consistent with Existing Patterns** - Mirrors the authenticated chat's card handling

## Testing Checklist

1. Admin sends a product card to visitor chat
2. Verify card renders with image, title, price, and "Book Now" button
3. Click "Book Now" as visitor → Auth modal should appear
4. Log in → Booking modal should auto-open for the product
5. Verify campaign cards render with "View" external link
6. Verify authenticated users can book directly without extra auth prompt

