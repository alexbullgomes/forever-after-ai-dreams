
# Unified Booking System with Post-Hold LIMITED Status and Chat Integration

## Executive Summary

This implementation unifies slot availability across Products and Campaign Packages, changes hold expiration behavior to transition to LIMITED instead of AVAILABLE, and integrates a chat-based fallback for LIMITED slots.

---

## Current State Analysis

### How Availability Works Today

| Component | Current Behavior |
|-----------|------------------|
| **Slot Status Computation** | SQL function `get_slot_availability()` computes status from rules, overrides, bookings, and active holds |
| **Hold Expiration** | When a hold expires in `create-booking-checkout`, it's marked as `'expired'` - no further action |
| **Expired Hold Handling** | `get_slot_availability()` only counts holds with `status = 'active' AND expires_at > now()` |
| **Result** | Expired holds are ignored → slot returns to AVAILABLE automatically |

### The Gap

1. **No post-expiration action**: When a hold expires, there's no mechanism to mark the slot as LIMITED
2. **Campaign packages have NULL product_id**: The SQL availability functions require a `product_id` and return `needs_review` for NULL
3. **No CTA differentiation**: Booking modal always shows "Hold my date & pay" regardless of slot status
4. **No chat integration**: No automated message injection for limited slots

---

## Implementation Plan

### Phase 1: Database - Expired Holds Create LIMITED Override

**New Database Logic:**

When a hold expires without converting to a booking, automatically create an `availability_override` with `status = 'limited'` for that slot.

**Migration SQL:**

```sql
-- Create function to handle hold expiration → LIMITED transition
CREATE OR REPLACE FUNCTION public.handle_hold_expiration_to_limited()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
  v_existing_override availability_overrides%ROWTYPE;
BEGIN
  -- Only trigger when status changes to 'expired'
  IF NEW.status = 'expired' AND OLD.status = 'active' THEN
    -- Determine the product_id to use
    -- For campaign holds, we need to skip or use a default product
    v_product_id := NEW.product_id;
    
    -- If no product_id (campaign-only booking), skip override creation
    -- Campaign packages don't have per-slot availability in this version
    IF v_product_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Check if an override already exists for this date
    SELECT * INTO v_existing_override
    FROM availability_overrides
    WHERE product_id = v_product_id
      AND date = NEW.event_date
    LIMIT 1;
    
    -- Only create LIMITED override if no override exists or existing is 'available'
    IF v_existing_override.id IS NULL THEN
      INSERT INTO availability_overrides (
        product_id,
        date,
        status,
        reason,
        created_by
      ) VALUES (
        v_product_id,
        NEW.event_date,
        'limited',
        'Expired hold - check with team for availability',
        NULL -- System-generated
      );
    ELSIF v_existing_override.status = 'available' THEN
      UPDATE availability_overrides
      SET status = 'limited',
          reason = 'Expired hold - check with team for availability'
      WHERE id = v_existing_override.id;
    END IF;
    -- If already limited/full/blocked, don't change it
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on booking_slot_holds
DROP TRIGGER IF EXISTS trigger_hold_expiration_to_limited ON booking_slot_holds;
CREATE TRIGGER trigger_hold_expiration_to_limited
  AFTER UPDATE OF status ON booking_slot_holds
  FOR EACH ROW
  WHEN (NEW.status = 'expired' AND OLD.status = 'active')
  EXECUTE FUNCTION handle_hold_expiration_to_limited();
```

**Why This Approach:**

1. **Uses existing infrastructure**: Leverages `availability_overrides` table which is already respected by `get_slot_availability()`
2. **Automatic**: Trigger-based, no frontend changes needed for the core behavior
3. **Reversible**: Admins can still change the status back to available if needed
4. **Campaign-safe**: Skips campaign-only holds (NULL product_id) since they don't use product-based availability

---

### Phase 2: Update Hold Expiration in Edge Function

Currently, `create-booking-checkout/index.ts` marks holds as `'expired'` inline. We need to ensure this triggers the database trigger properly.

**File: `supabase/functions/create-booking-checkout/index.ts`**

The existing code at line 150-153 already updates status to `'expired'`, which will trigger our new database trigger. No changes needed here.

**However**, we should also add a scheduled job or cron to expire stale holds that weren't explicitly marked. This can be a future enhancement. For now, the edge function handles expiration correctly.

---

### Phase 3: Frontend - Conditional CTA Based on Slot Status

**File: `src/components/booking/BookingStepSlots.tsx`**

Add logic to:
1. Detect when the selected slot has `status === 'limited'`
2. Show different CTA: "Check availability with our team" instead of "Hold my date & pay"
3. On click, trigger chat modal with pre-filled message

**Changes:**

```typescript
interface BookingStepSlotsProps {
  // ... existing props
  onChatAvailability?: (date: Date, time: string, productTitle: string, price: number) => void;
}

// Inside component:
const selectedSlotStatus = useMemo(() => {
  if (!selectedTime) return null;
  const slot = timeSlots.find(s => 
    (typeof s === 'string' ? s : s.start) === selectedTime
  );
  return typeof slot === 'object' ? slot.status : 'available';
}, [selectedTime, timeSlots]);

const isLimitedSlot = selectedSlotStatus === 'limited';

// In render:
{isLimitedSlot ? (
  <Button
    onClick={() => onChatAvailability?.(eventDate, selectedTime!, productTitle, productPrice)}
    disabled={!selectedTime}
    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
    size="lg"
  >
    Check availability with our team
  </Button>
) : (
  <Button
    onClick={onCheckout}
    disabled={!selectedTime || isLoading}
    className="w-full bg-brand-gradient hover:opacity-90"
    size="lg"
  >
    {isLoading ? 'Processing...' : 'Hold my date & pay'}
  </Button>
)}

{isLimitedSlot && (
  <p className="text-xs text-center text-amber-600">
    This slot has limited availability. Our team will confirm within 24 hours.
  </p>
)}
```

---

### Phase 4: Chat Integration - Auto-Send Message

**File: `src/components/booking/BookingFunnelModal.tsx`**

Add state and handler to open chat with pre-composed message:

```typescript
interface BookingFunnelModalProps {
  // ... existing props
  onOpenChatWithMessage?: (message: string) => void;
}

// Handler:
const handleChatAvailability = useCallback((
  date: Date,
  time: string,
  title: string,
  price: number
) => {
  const formattedDate = format(date, 'MMMM d, yyyy');
  const formattedTime = formatTime(time);
  
  const message = `Hi! I'm interested in booking the following slot, but it shows as limited.\n\nDate: ${formattedDate}\nTime: ${formattedTime}\nPackage/Product: ${title}\n\nCan you confirm availability?`;
  
  // Close modal and trigger chat
  onClose();
  onOpenChatWithMessage?.(message);
}, [onClose, onOpenChatWithMessage]);

// Pass to BookingStepSlots:
<BookingStepSlots
  // ... existing props
  onChatAvailability={handleChatAvailability}
/>
```

**Integration Points:**

The parent components (`Planner.tsx`, `PromotionalLanding.tsx`, etc.) need to accept and pass `onOpenChatWithMessage` to open the chat assistant and inject the message.

**File: `src/components/ui/expandable-chat-assistant.tsx`**

Add method to programmatically send a message:

```typescript
// Add ref forwarding or use a global state/event system
// Option 1: Export a method via context
// Option 2: Use a custom event

// For simplicity, we can use a custom event:
useEffect(() => {
  const handleChatMessage = (event: CustomEvent<{ message: string }>) => {
    setInput(event.detail.message);
    // Auto-open the chat
    // Submit the message
  };
  
  window.addEventListener('everafter:open-chat-with-message', handleChatMessage as EventListener);
  return () => {
    window.removeEventListener('everafter:open-chat-with-message', handleChatMessage as EventListener);
  };
}, []);
```

---

### Phase 5: Global Availability for Campaign Packages

**Current Issue:**

Campaign packages have `product_id = NULL`, so `get_slot_availability()` returns `needs_review`.

**Solution Options:**

| Option | Pros | Cons |
|--------|------|------|
| A: Create a "global" product for campaigns | Simple, uses existing infrastructure | Artificial, confusing |
| B: Extend SQL functions to support package_id | Clean, proper isolation | Requires significant SQL changes |
| C: Use a default product for campaign availability | Quick fix | Not truly global |
| **D: Accept current behavior for campaigns** | No changes needed | Campaigns don't show real availability |

**Recommended Approach: Option D (for now)**

Campaign packages currently don't use product-based availability. The booking modal shows a simplified slot selection without real-time availability checks. This is acceptable because:

1. Campaign bookings are high-touch (human review expected)
2. The LIMITED → chat flow will still work for campaign slots if we add package-based availability later
3. Adding full availability for campaigns requires significant schema work

**Future Enhancement:**

Create a `campaign_availability_rules` table that mirrors product availability but scopes by `campaign_id` or `package_id`.

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `supabase/migrations/new_*.sql` | Add trigger for hold expiration → LIMITED | High |
| `src/components/booking/BookingStepSlots.tsx` | Conditional CTA based on slot status | High |
| `src/components/booking/BookingFunnelModal.tsx` | Handle chat availability callback | High |
| `src/components/ui/expandable-chat-assistant.tsx` | Accept programmatic message injection | High |
| `src/pages/Planner.tsx` | Wire up chat trigger from booking modal | Medium |
| `src/pages/PromotionalLanding.tsx` | Wire up chat trigger for campaign pages | Medium |

---

## Data Flow Diagram

```text
User selects slot
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  BookingStepSlots checks slot.status                        │
├─────────────────────────────────────────────────────────────┤
│  status === 'available'        status === 'limited'        │
│          │                              │                   │
│          ▼                              ▼                   │
│  [Hold my date & pay]          [Check with team]           │
│          │                              │                   │
│          ▼                              ▼                   │
│  create-booking-checkout       Open Chat + Send Message     │
│          │                              │                   │
│          ▼                              ▼                   │
│  Stripe Checkout               Human reviews availability   │
└─────────────────────────────────────────────────────────────┘

When hold expires without payment:
┌─────────────────────────────────────────────────────────────┐
│  booking_slot_holds.status → 'expired'                      │
│          │                                                  │
│          ▼                                                  │
│  Trigger: handle_hold_expiration_to_limited()               │
│          │                                                  │
│          ▼                                                  │
│  INSERT INTO availability_overrides (status='limited')      │
│          │                                                  │
│          ▼                                                  │
│  Next user sees slot as LIMITED (yellow)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Validation Checklist

| Test Case | Expected Result |
|-----------|-----------------|
| Product booking - available slot | Shows "Hold my date & pay", Stripe checkout works |
| Product booking - limited slot | Shows "Check availability with our team", opens chat |
| Campaign booking - slot selection | Shows simplified UI (current behavior maintained) |
| Hold expires (not paid) | Slot becomes LIMITED via trigger |
| Admin manually sets available | Slot shows as available (override respected) |
| Chat message injection | Message appears in chat input, chat opens |
| Existing bookings unaffected | No changes to confirmed/paid bookings |

---

## What Stays Unchanged

- Campaign landing page UI
- Booking modal layout and steps
- Stripe checkout flow for available slots
- Hold duration (15 minutes)
- Admin availability manager
- Existing availability rules and overrides
- Real-time availability computation logic

---

## Technical Notes

### Why Database Trigger vs. Cron Job

A trigger is immediate and guaranteed to fire when the status changes. A cron job would need to scan for expired holds periodically, which:
1. Adds delay
2. Requires additional infrastructure
3. Could miss edge cases

The trigger approach is cleaner and more reliable.

### Campaign Package Availability

For this implementation, campaign packages continue to use a simplified availability model. Full per-package availability would require:
1. New table: `campaign_availability_rules`
2. Extended SQL functions with `package_id` parameter
3. Migration of existing campaign overrides

This is out of scope for the current request but noted for future enhancement.

---

## Implementation Order

1. **Migration**: Create database trigger for hold expiration → LIMITED
2. **BookingStepSlots**: Add conditional CTA logic
3. **BookingFunnelModal**: Add chat callback handler
4. **ExpandableChatAssistant**: Add programmatic message support
5. **Planner.tsx**: Wire up chat trigger
6. **PromotionalLanding.tsx**: Wire up chat trigger for campaigns
7. **Testing**: End-to-end verification
