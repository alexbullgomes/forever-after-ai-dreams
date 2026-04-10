

# Manual Payment Override with Shared Booking Logic

## Architecture

Extract `processBookingPayment` from `stripe-webhook/index.ts` into a shared module (`supabase/functions/_shared/processBookingPayment.ts`) used by both `stripe-webhook` and a new `manual-payment` edge function. This eliminates logic duplication and guarantees consistency.

```text
supabase/functions/
  _shared/
    processBookingPayment.ts   ← NEW shared module
  stripe-webhook/
    index.ts                   ← imports from _shared
  manual-payment/
    index.ts                   ← NEW, imports from _shared
```

## Shared Function Interface

The shared `processBookingPayment` accepts a caller-agnostic params object:

```typescript
interface BookingPaymentParams {
  supabase: SupabaseClient;
  booking_request_id: string;
  product_id: string | null;
  event_date: string;
  selected_time: string;
  hold_id?: string;
  user_id?: string;
  campaign_id?: string | null;
  package_id?: string | null;
  // Payment details (caller provides)
  stripe_payment_intent: string | null;
  stripe_checkout_session_id: string | null;
  amount_paid: number | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  // Manual payment flag
  manual_payment: boolean;
}
```

The function handles all 6 steps identically regardless of caller:
1. Calculate `end_time` from `selected_time` + slot duration (fetched from `product_booking_rules`)
2. Insert `bookings` record (with nullable Stripe fields for manual payments)
3. Convert slot hold if `hold_id` provided
4. Update `booking_requests.stage` to `'paid'`
5. Activate user profile (`user_dashboard: true`, `pipeline_profile: 'Enable'`, `pipeline_status: 'New Lead & Negotiation'`) with the same `OR` guard
6. Fire n8n webhook with identical payload structure + `manual_payment` flag

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/_shared/processBookingPayment.ts` | **Create** - Extracted shared logic |
| `supabase/functions/stripe-webhook/index.ts` | **Modify** - Import shared function, remove inline `processBookingPayment` |
| `supabase/functions/manual-payment/index.ts` | **Create** - Admin-only edge function |
| `supabase/config.toml` | **Modify** - Add `[functions.manual-payment]` with `verify_jwt = false` |
| `src/pages/BookingsPipeline.tsx` | **Modify** - Add "Mark as Paid" button + confirmation dialog |

## Edge Function: `manual-payment`

1. Validate JWT from Authorization header
2. Verify admin role via `has_role(uid, 'admin')` using service_role client
3. Fetch booking_request by ID to get `event_date`, `selected_time`, `product_id`, `package_id`, `user_id`, `campaign_id`
4. Check no existing booking for this `booking_request_id` (prevent double execution)
5. Look up customer name/email from `profiles` table using `user_id`
6. Call shared `processBookingPayment` with `manual_payment: true`, Stripe fields as `null`
7. Log to `availability_audit_log` with `actor_id` and action `'manual_payment'`
8. Return success with booking ID

**Input**: `{ booking_request_id, amount_paid?, payment_method?, notes? }`

## Frontend: BookingsPipeline.tsx

Add to the Actions column (next to existing buttons):
- `DollarSign` icon button, visible when `stage !== 'paid'` AND `user_id` is not null AND `selected_time` is not null
- Opens confirmation `AlertDialog` with:
  - Booking summary (product/package, date, time)
  - Amount input (dollars, converted to cents)
  - Payment method select (Cash, Bank Transfer, Zelle, Other)
  - Optional notes textarea
- On confirm: `supabase.functions.invoke('manual-payment', { body })` 
- On success: toast + refresh list

## No Schema Changes Required

Existing `bookings` table already supports nullable `stripe_payment_intent`, `stripe_checkout_session_id`, and `amount_paid`. The `availability_audit_log` table exists for audit logging.

## n8n Payload Consistency

The shared function sends the exact same payload to `https://agcreationmkt.cloud/webhook/stripe-checkout-n8n`:

```typescript
{
  booking_id, user_id, full_name, email, phone,
  product_id, product_title, campaign_id, package_id,
  event_date, amount_paid,
  stripe_payment_intent: null,       // null for manual
  stripe_checkout_session_id: null,  // null for manual
  manual_payment: true               // additional flag
}
```

## Safety Guarantees

- `processBookingPayment` is the single source of truth for both callers
- `pipeline_status` uses `'New Lead & Negotiation'` (matching existing webhook logic exactly)
- End time calculation reuses the same `product_booking_rules` lookup
- Duplicate booking prevention: check existing booking on `booking_request_id` before insert
- Admin-only: JWT + `has_role` verification in edge function
- Zero changes to Stripe webhook flow or checkout process

