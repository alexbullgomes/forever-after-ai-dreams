import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep('Webhook received', { method: req.method });

  // Only accept POST requests
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
    // Read raw body for signature verification
    const body = await req.text();
    
    // CRITICAL: Verify webhook signature to ensure request is from Stripe
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep('Event verified', { type: event.type, id: event.id });

    // Handle checkout.session.completed event
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

  // Only process successful payments
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
    booking_request_id, 
    hold_id, 
    event_date, 
    selected_time,
    campaign_mode,
    package_id,
  });

  // Process booking-based payments (campaign deposits or product bookings)
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
    supabase, 
    session, 
    booking_request_id, 
    product_id, 
    event_date, 
    selected_time, 
    hold_id, 
    user_id,
    campaign_id,
    package_id,
  } = params;

  logStep('Processing booking payment', { booking_request_id, product_id, package_id });

  // Calculate end_time based on slot duration
  let slotDuration = 60; // default 60 minutes
  
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

  // Parse selected_time and calculate end_time
  const timeParts = selected_time.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  const totalMinutes = hours * 60 + minutes + slotDuration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  const end_time = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

  logStep('Calculated booking times', { start: selected_time, end: end_time, duration: slotDuration });

  // Create confirmed booking
  // CRITICAL: product_id is now nullable for campaign bookings
  const bookingInsert: any = {
    booking_request_id,
    event_date,
    start_time: selected_time,
    end_time,
    status: 'confirmed',
    stripe_payment_intent: session.payment_intent as string,
    customer_name: session.customer_details?.name || null,
    customer_email: session.customer_details?.email || null,
  };

  // Only set product_id if it exists (null for campaign bookings)
  if (product_id) {
    bookingInsert.product_id = product_id;
  }

  // Set package_id for campaign bookings
  if (package_id) {
    bookingInsert.package_id = package_id;
  }

  // Set user_id if available
  if (user_id) {
    bookingInsert.user_id = user_id;
  }

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

  // Convert slot hold to 'converted' status
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

  // Update booking request to 'paid' stage
  const { error: requestError } = await supabase
    .from('booking_requests')
    .update({
      stage: 'paid',
      stripe_checkout_session_id: session.id,
    })
    .eq('id', booking_request_id);

  if (requestError) {
    logStep('WARNING: Failed to update booking request', { error: requestError.message });
  } else {
    logStep('Booking request updated to paid', { requestId: booking_request_id });
  }

  logStep('Booking payment processed successfully');
}

