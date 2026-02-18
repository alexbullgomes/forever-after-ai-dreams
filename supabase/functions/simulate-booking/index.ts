import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Validate caller identity
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Use service role for privileged operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify admin role
    const { data: roleCheck } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find a test product (price = 100 or title contains "Test")
    let product = null;
    const { data: products } = await supabase
      .from('products')
      .select('id, title, price')
      .or('price.eq.100,title.ilike.%Test%')
      .limit(1);

    if (products && products.length > 0) {
      product = products[0];
    } else {
      // Fallback: use any active product
      const { data: anyProduct } = await supabase
        .from('products')
        .select('id, title, price')
        .eq('is_active', true)
        .limit(1);
      if (anyProduct && anyProduct.length > 0) {
        product = anyProduct[0];
      }
    }

    if (!product) {
      return new Response(JSON.stringify({ error: 'No product found for test booking' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate event date (today + 7 days)
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 7);
    const eventDateStr = eventDate.toISOString().split('T')[0];

    // Insert test booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        product_id: product.id,
        user_id: userId,
        event_date: eventDateStr,
        start_time: '10:00',
        end_time: '11:00',
        status: 'confirmed',
        stripe_payment_intent: 'TEST_INTENT_' + Date.now(),
        stripe_checkout_session_id: 'TEST_SESSION_' + Date.now(),
        amount_paid: Math.round(product.price * 100), // cents
        customer_name: 'Test Admin',
        customer_email: claimsData.claims.email as string || null,
      })
      .select('id')
      .single();

    if (bookingError) {
      console.error('Booking insert error:', bookingError);
      return new Response(JSON.stringify({ error: 'Failed to create booking', details: bookingError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Activate dashboard + pipeline
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        user_dashboard: true,
        pipeline_profile: 'Enable',
        pipeline_status: 'New Lead & Negotiation',
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    return new Response(JSON.stringify({
      success: true,
      booking_id: booking.id,
      product_title: product.title,
      event_date: eventDateStr,
      message: 'Test booking created. No Stripe or n8n calls were made.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Simulate booking error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
