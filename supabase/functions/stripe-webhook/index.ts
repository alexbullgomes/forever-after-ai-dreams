import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { processBookingPayment } from '../_shared/processBookingPayment.ts';

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
      booking_request_id,
      product_id: campaign_mode === 'true' ? null : (product_id || null),
      event_date,
      selected_time,
      hold_id,
      user_id,
      campaign_id: campaign_mode === 'true' ? (campaign_id || null) : null,
      package_id: campaign_mode === 'true' ? (package_id || null) : null,
      stripe_payment_intent: session.payment_intent as string,
      stripe_checkout_session_id: session.id,
      amount_paid: session.amount_total,
      customer_name: session.customer_details?.name || null,
      customer_email: session.customer_details?.email || null,
      customer_phone: session.customer_details?.phone || null,
      manual_payment: false,
    });
  } else {
    logStep('Unknown payment type, storing for manual review', { metadata });
  }
}
