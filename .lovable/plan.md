

## Post-Checkout Flow: Structural Update

This plan connects the full lifecycle: Stripe payment -> Supabase data -> Pipeline activation -> User Dashboard -> n8n notification.

---

### Database Migration (Required First)

Add two missing columns to the `bookings` table:

```text
ALTER TABLE bookings ADD COLUMN stripe_checkout_session_id text;
ALTER TABLE bookings ADD COLUMN amount_paid integer;
```

- `stripe_checkout_session_id`: Links booking back to Stripe session for PaymentSuccess page lookup
- `amount_paid`: Amount in cents for display in Service Tracking

No RLS changes needed -- existing policies ("Users can view their own bookings" via `auth.uid() = user_id` and service_role INSERT) are sufficient.

---

### Part 1: Stripe Webhook Update

**File: `supabase/functions/stripe-webhook/index.ts`**

Update `processBookingPayment` to perform three additional operations after booking creation:

**A) Store new fields on booking insert:**
- `stripe_checkout_session_id: session.id`
- `amount_paid: session.amount_total` (integer, cents)

**B) Update user profile (activate dashboard + pipeline):**
```
UPDATE profiles SET
  user_dashboard = true,
  pipeline_profile = 'Enable',
  pipeline_status = 'New Lead & Negotiation'
WHERE id = user_id
  AND (pipeline_profile IS NULL OR pipeline_profile != 'Enable')
```
Only update `pipeline_status` if not already enabled (avoid overwriting admin-set statuses).

**C) Fetch product/package title for n8n payload:**
- If `product_id` exists, query `products` for title
- If `package_id` exists, query `campaign_packages` for title

---

### Part 2: N8N Webhook (Server-Side)

**File: `supabase/functions/stripe-webhook/index.ts`** (continued)

After all DB operations, fire a POST to:
`https://agcreationmkt.cloud/webhook/stripe-checkout-n8n`

Payload:
```text
{
  booking_id, user_id, full_name, email, phone,
  product_id, product_title,
  campaign_id, package_id, event_date,
  amount_paid, stripe_payment_intent,
  stripe_checkout_session_id
}
```

- `full_name`, `email`, `phone` come from `session.customer_details`
- Fire-and-forget (logged but non-blocking, errors caught gracefully)
- Entirely server-side; no frontend exposure

---

### Part 3: Payment Success Page

**File: `src/pages/PaymentSuccess.tsx`**

Currently shows static "Wedding Package" text and routes to `/services`.

Changes:
- Read `session_id` from URL search params (already passed by `create-booking-checkout` success_url)
- Query `bookings` table by `stripe_checkout_session_id` to get the booking record
- Join with `products` (via product_id) or `campaign_packages` (via package_id) to get the name
- Display real product/package name, event date, and formatted amount
- Update button destinations:
  - "Chat with Our Planner" -> `/user-dashboard/ai-assistant`
  - "View Your Booking" -> `/user-dashboard/service-tracking`
- Graceful fallback to "Your Package" if booking not found yet (webhook may be processing)

---

### Part 4: Service Tracking Page

**File: `src/pages/ServiceTracking.tsx`**

Add a "Your Booked Service" card above the pipeline progress tracker:
- Query `bookings` table for the logged-in user's most recent confirmed booking
- Left-join with `products` and `campaign_packages` to resolve the name
- Display card with: Product/Package Name, Event Date, Amount Paid (formatted as USD), Booking ID (truncated), Payment Status badge, Stripe Payment Intent ID
- If no bookings found, skip the card gracefully (show nothing, not an error)
- Uses existing Card/CardContent components -- no new UI components needed

---

### Part 5: Files Changed Summary

| File | Change Type |
|------|------------|
| Migration SQL | Add `stripe_checkout_session_id` and `amount_paid` to `bookings` |
| `supabase/functions/stripe-webhook/index.ts` | Store new columns, activate profile, send n8n webhook |
| `src/pages/PaymentSuccess.tsx` | Dynamic booking lookup, updated button routes |
| `src/pages/ServiceTracking.tsx` | Add booking details card above pipeline tracker |

### What Will NOT Change
- Database schema for other tables
- RLS policies (existing are sufficient)
- Edge functions other than `stripe-webhook`
- UI styling/design
- Availability logic, booking creation logic
- Authentication flow
- `create-booking-checkout` edge function

### Validation Checklist
- Booking created with `stripe_checkout_session_id` and `amount_paid` populated
- Profile flags `user_dashboard` and `pipeline_profile` auto-activated
- User appears in admin Pipeline Process
- n8n webhook triggered server-side with full payload
- Service Tracking shows booking details card
- Payment Success displays correct product/package name
- Buttons route to `/user-dashboard/ai-assistant` and `/user-dashboard/service-tracking`
- No RLS conflicts (service_role bypasses for webhook, user SELECT for own bookings)

