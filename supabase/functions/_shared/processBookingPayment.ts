import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BOOKING-PAYMENT] ${step}${detailsStr}`);
};

export interface BookingPaymentParams {
  supabase: ReturnType<typeof createClient>;
  booking_request_id: string;
  product_id: string | null;
  event_date: string;
  selected_time: string;
  hold_id?: string;
  user_id?: string;
  campaign_id?: string | null;
  package_id?: string | null;
  stripe_payment_intent: string | null;
  stripe_checkout_session_id: string | null;
  amount_paid: number | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  manual_payment: boolean;
}

export interface BookingPaymentResult {
  booking_id: string;
  success: boolean;
}

export async function processBookingPayment(params: BookingPaymentParams): Promise<BookingPaymentResult> {
  const {
    supabase, booking_request_id, product_id, event_date,
    selected_time, hold_id, user_id, campaign_id, package_id,
    stripe_payment_intent, stripe_checkout_session_id,
    amount_paid, customer_name, customer_email, customer_phone,
    manual_payment,
  } = params;

  const source = manual_payment ? 'MANUAL' : 'STRIPE';
  logStep(`Processing booking payment (${source})`, { booking_request_id, product_id, package_id });

  // 1. Calculate end_time based on slot duration
  let slotDuration = 60;
  if (product_id) {
    const { data: rules } = await supabase
      .from('product_booking_rules')
      .select('slot_duration_minutes')
      .eq('product_id', product_id)
      .maybeSingle();
    if (rules?.slot_duration_minutes) {
      slotDuration = rules.slot_duration_minutes;
    }
  }

  const timeParts = selected_time.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  const totalMinutes = hours * 60 + minutes + slotDuration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  const end_time = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

  logStep('Calculated booking times', { start: selected_time, end: end_time, duration: slotDuration });

  // 2. Create booking record
  const bookingInsert: Record<string, unknown> = {
    booking_request_id,
    event_date,
    start_time: selected_time,
    end_time,
    status: 'confirmed',
    stripe_payment_intent: stripe_payment_intent || null,
    stripe_checkout_session_id: stripe_checkout_session_id || null,
    amount_paid: amount_paid ?? 0,
    customer_name: customer_name || null,
    customer_email: customer_email || null,
  };

  if (product_id) bookingInsert.product_id = product_id;
  if (package_id) bookingInsert.package_id = package_id;
  if (user_id) bookingInsert.user_id = user_id;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert(bookingInsert)
    .select()
    .single();

  if (bookingError) {
    logStep('ERROR creating booking', { error: bookingError.message, code: bookingError.code });
    throw bookingError;
  }

  logStep('Booking created successfully', { bookingId: booking.id });

  // 3. Convert slot hold (if exists)
  if (hold_id) {
    const { error: holdError } = await supabase
      .from('booking_slot_holds')
      .update({ status: 'converted' })
      .eq('id', hold_id);
    if (holdError) {
      logStep('WARNING: Failed to update slot hold', { error: holdError.message });
    } else {
      logStep('Slot hold converted', { holdId: hold_id });
    }
  }

  // 4. Update booking request to 'paid'
  const { error: requestError } = await supabase
    .from('booking_requests')
    .update({ stage: 'paid', stripe_checkout_session_id: stripe_checkout_session_id || null })
    .eq('id', booking_request_id);
  if (requestError) {
    logStep('WARNING: Failed to update booking request', { error: requestError.message });
  } else {
    logStep('Booking request updated to paid', { requestId: booking_request_id });
  }

  // 5. Activate user dashboard + pipeline
  if (user_id) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        user_dashboard: true,
        pipeline_profile: 'Enable',
        pipeline_status: 'New Lead & Negotiation',
      })
      .eq('id', user_id)
      .or('pipeline_profile.is.null,pipeline_profile.neq.Enable');

    if (profileError) {
      logStep('WARNING: Failed to activate profile', { error: profileError.message });
    } else {
      logStep('Profile activated for pipeline', { userId: user_id });
    }
  }

  // 6. Resolve product/package title for n8n
  let product_title: string | null = null;
  if (product_id) {
    const { data: prod } = await supabase.from('products').select('title').eq('id', product_id).maybeSingle();
    product_title = prod?.title || null;
  } else if (package_id) {
    const { data: pkg } = await supabase.from('campaign_packages').select('title').eq('id', package_id).maybeSingle();
    product_title = pkg?.title || null;
  }

  // 7. Fire n8n webhook (fire-and-forget)
  try {
    const n8nPayload: Record<string, unknown> = {
      booking_id: booking.id,
      user_id: user_id || null,
      full_name: customer_name || null,
      email: customer_email || null,
      phone: customer_phone || null,
      product_id: product_id || null,
      product_title,
      campaign_id: campaign_id || null,
      package_id: package_id || null,
      event_date,
      amount_paid,
      stripe_payment_intent: stripe_payment_intent || null,
      stripe_checkout_session_id: stripe_checkout_session_id || null,
      manual_payment,
    };

    logStep('Sending n8n webhook', { booking_id: booking.id, manual_payment });
    fetch('https://agcreationmkt.cloud/webhook/stripe-checkout-n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    }).catch((e) => logStep('WARNING: n8n webhook failed', { error: String(e) }));
  } catch (e) {
    logStep('WARNING: n8n webhook error', { error: String(e) });
  }

  logStep(`Booking payment processed successfully (${source})`);
  return { booking_id: booking.id, success: true };
}
