import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep('Webhook received', { method: req.method });

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!stripeKey) {
    logStep('ERROR: Missing STRIPE_SECRET_KEY');
    return new Response('Server configuration error', { status: 500 });
  }

  if (!webhookSecret) {
    logStep('ERROR: Missing STRIPE_WEBHOOK_SECRET');
    return new Response('Server configuration error', { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-08-27.basil' });

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    logStep('ERROR: Missing stripe-signature header');
    return new Response('Missing signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    logStep('Event verified', { type: event.type, id: event.id });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
    } else {
      logStep('Event type not handled', { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logStep('ERROR processing webhook', { error: errorMessage });
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
});

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  logStep('Processing checkout.session.completed', { 
    sessionId: session.id,
    paymentStatus: session.payment_status 
  });

  if (session.payment_status !== 'paid') {
    logStep('Payment not completed, skipping', { status: session.payment_status });
    return;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const metadata = session.metadata || {};
  const {
    booking_request_id,
    product_id,
    event_date,
    selected_time,
    hold_id,
    user_id,
    campaign_mode,
    campaign_id,
    package_id,
  } = metadata;

  logStep('Session metadata', { 
    booking_request_id, hold_id, event_date, selected_time, campaign_mode, package_id,
  });

  if (booking_request_id && event_date && selected_time) {
    await processBookingPayment({
      supabase,
      session,
      booking_request_id,
      product_id: campaign_mode === 'true' ? null : product_id,
      event_date,
      selected_time,
      hold_id,
      user_id,
      campaign_id: campaign_mode === 'true' ? campaign_id : null,
      package_id: campaign_mode === 'true' ? package_id : null,
    });
  } else {
    logStep('Unknown payment type, storing for manual review', { metadata });
  }
}

async function processBookingPayment(params: {
  supabase: ReturnType<typeof createClient>;
  session: Stripe.Checkout.Session;
  booking_request_id: string;
  product_id: string | null;
  event_date: string;
  selected_time: string;
  hold_id?: string;
  user_id?: string;
  campaign_id?: string | null;
  package_id?: string | null;
}) {
  const { 
    supabase, session, booking_request_id, product_id, event_date, 
    selected_time, hold_id, user_id, campaign_id, package_id,
  } = params;

  logStep('Processing booking payment', { booking_request_id, product_id, package_id });

  // Calculate end_time based on slot duration
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

  // Build booking insert with new fields
  const bookingInsert: Record<string, unknown> = {
    booking_request_id,
    event_date,
    start_time: selected_time,
    end_time,
    status: 'confirmed',
    stripe_payment_intent: session.payment_intent as string,
    stripe_checkout_session_id: session.id,
    amount_paid: session.amount_total,
    customer_name: session.customer_details?.name || null,
    customer_email: session.customer_details?.email || null,
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

  // Convert slot hold
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

  // Update booking request to 'paid'
  const { error: requestError } = await supabase
    .from('booking_requests')
    .update({ stage: 'paid', stripe_checkout_session_id: session.id })
    .eq('id', booking_request_id);
  if (requestError) {
    logStep('WARNING: Failed to update booking request', { error: requestError.message });
  } else {
    logStep('Booking request updated to paid', { requestId: booking_request_id });
  }

  // Activate user dashboard + pipeline
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

  // Resolve product/package title for n8n
  let product_title: string | null = null;
  if (product_id) {
    const { data: prod } = await supabase.from('products').select('title').eq('id', product_id).maybeSingle();
    product_title = prod?.title || null;
  } else if (package_id) {
    const { data: pkg } = await supabase.from('campaign_packages').select('title').eq('id', package_id).maybeSingle();
    product_title = pkg?.title || null;
  }

  // Fire n8n webhook (fire-and-forget)
  try {
    const n8nPayload = {
      booking_id: booking.id,
      user_id: user_id || null,
      full_name: session.customer_details?.name || null,
      email: session.customer_details?.email || null,
      phone: session.customer_details?.phone || null,
      product_id: product_id || null,
      product_title,
      campaign_id: campaign_id || null,
      package_id: package_id || null,
      event_date,
      amount_paid: session.amount_total,
      stripe_payment_intent: session.payment_intent,
      stripe_checkout_session_id: session.id,
    };

    logStep('Sending n8n webhook', { booking_id: booking.id });
    fetch('https://agcreationmkt.cloud/webhook/stripe-checkout-n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    }).catch((e) => logStep('WARNING: n8n webhook failed', { error: String(e) }));
  } catch (e) {
    logStep('WARNING: n8n webhook error', { error: String(e) });
  }

  logStep('Booking payment processed successfully');
}
