import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { processBookingPayment } from '../_shared/processBookingPayment.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANUAL-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // 1. Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      logStep('ERROR: Invalid JWT');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminUserId = claimsData.claims.sub as string;
    logStep('Admin authenticated', { adminUserId });

    // 2. Verify admin role using service_role client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userRole } = await supabase.rpc('check_user_role_only', {
      _user_id: adminUserId,
    });
    const isAdmin = userRole === 'admin';

    if (!isAdmin) {
      logStep('ERROR: Not an admin', { adminUserId });
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Parse request body
    const body = await req.json();
    const { booking_request_id, amount_paid, payment_method, notes } = body;

    if (!booking_request_id) {
      return new Response(JSON.stringify({ error: 'booking_request_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep('Processing manual payment', { booking_request_id, amount_paid, payment_method });

    // 4. Fetch booking request
    const { data: bookingRequest, error: brError } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('id', booking_request_id)
      .single();

    if (brError || !bookingRequest) {
      logStep('ERROR: Booking request not found', { booking_request_id });
      return new Response(JSON.stringify({ error: 'Booking request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (bookingRequest.stage === 'paid') {
      return new Response(JSON.stringify({ error: 'Booking request is already paid' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!bookingRequest.selected_time) {
      return new Response(JSON.stringify({ error: 'No time selected for this booking request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Check for duplicate booking
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_request_id', booking_request_id)
      .maybeSingle();

    if (existingBooking) {
      return new Response(JSON.stringify({ error: 'A booking already exists for this request' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Look up customer info from profiles
    let customerName: string | null = null;
    let customerEmail: string | null = null;
    if (bookingRequest.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', bookingRequest.user_id)
        .maybeSingle();
      customerName = profile?.name || null;
      customerEmail = profile?.email || null;
    }

    // 7. Find active hold (if any)
    const { data: activeHold } = await supabase
      .from('booking_slot_holds')
      .select('id')
      .eq('booking_request_id', booking_request_id)
      .eq('status', 'active')
      .maybeSingle();

    // 8. Call shared processBookingPayment
    const result = await processBookingPayment({
      supabase,
      booking_request_id,
      product_id: bookingRequest.product_id || null,
      event_date: bookingRequest.event_date,
      selected_time: bookingRequest.selected_time,
      hold_id: activeHold?.id,
      user_id: bookingRequest.user_id || undefined,
      campaign_id: bookingRequest.campaign_id || null,
      package_id: bookingRequest.package_id || null,
      stripe_payment_intent: null,
      stripe_checkout_session_id: null,
      amount_paid: amount_paid ?? 0,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: null,
      manual_payment: true,
    });

    // 9. Audit log
    await supabase.from('availability_audit_log').insert({
      actor_id: adminUserId,
      action: 'manual_payment',
      payload: {
        booking_request_id,
        booking_id: result.booking_id,
        amount_paid: amount_paid ?? 0,
        payment_method: payment_method || 'other',
        notes: notes || null,
      },
    });

    logStep('Manual payment completed', { booking_id: result.booking_id });

    return new Response(JSON.stringify({ success: true, booking_id: result.booking_id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logStep('ERROR', { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
