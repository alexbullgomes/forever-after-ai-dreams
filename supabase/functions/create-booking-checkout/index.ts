import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BOOKING-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      booking_request_id,
      product_id,
      event_date,
      selected_time,
      product_title,
      product_price,
      currency,
      user_id,
      visitor_id,
      // Campaign fields
      campaign_mode,
      campaign_id,
      campaign_slug,
      // NEW: Package fields (replaces card_index)
      package_id,
      minimum_deposit_cents,
      // Legacy: card_index for backward compatibility
      card_index,
    } = body;

    logStep("Request body parsed", { 
      booking_request_id, 
      product_id, 
      event_date, 
      selected_time, 
      campaign_mode,
      campaign_id,
      package_id,
      minimum_deposit_cents,
    });

    // Determine charge amount and currency
    // For campaign mode: use per-package deposit or fallback to $150
    let chargeAmount: number;
    if (campaign_mode) {
      // Validate deposit is configured
      if (!minimum_deposit_cents || minimum_deposit_cents < 100) {
        logStep("ERROR: Package deposit not configured", { minimum_deposit_cents });
        return new Response(
          JSON.stringify({ error: "Package deposit not configured. Please contact support." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      chargeAmount = minimum_deposit_cents / 100; // Convert cents to dollars
    } else {
      chargeAmount = product_price;
    }
    const chargeCurrency = campaign_mode ? 'usd' : (currency?.toLowerCase() || 'usd');
    
    logStep("Charge details", { chargeAmount, chargeCurrency, campaign_mode });

    // Fetch product booking rules for hold duration (skip for campaigns - use defaults)
    let holdMinutes = 15;
    let slotDuration = 60;
    
    if (product_id && !campaign_mode) {
      const { data: rules } = await supabase
        .from("product_booking_rules")
        .select("checkout_hold_minutes, slot_duration_minutes")
        .eq("product_id", product_id)
        .maybeSingle();

      holdMinutes = rules?.checkout_hold_minutes ?? 15;
      slotDuration = rules?.slot_duration_minutes ?? 60;
    }
    
    logStep("Booking rules", { holdMinutes, slotDuration });

    // Calculate end time
    const [hours, minutes] = selected_time.split(":").map(Number);
    const endMinutes = hours * 60 + minutes + slotDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const end_time = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

    logStep("End time calculated", { end_time });

    // Check for existing active/converted hold
    // For campaigns with package_id, scope by package_id to prevent different packages from blocking each other
    let existingHoldQuery = supabase
      .from("booking_slot_holds")
      .select("id, status, expires_at")
      .eq("event_date", event_date)
      .eq("start_time", selected_time)
      .in("status", ["active", "converted"]);

    if (campaign_mode && package_id) {
      // NEW: Scope by package_id for proper isolation
      existingHoldQuery = existingHoldQuery.eq("package_id", package_id);
    } else if (campaign_mode && campaign_id) {
      // Legacy fallback: scope by campaign_id
      existingHoldQuery = existingHoldQuery.eq("campaign_id", campaign_id);
    } else if (product_id) {
      existingHoldQuery = existingHoldQuery.eq("product_id", product_id);
    }

    const { data: existingHold } = await existingHoldQuery.maybeSingle();

    if (existingHold) {
      // Check if it's an active hold that hasn't expired
      if (existingHold.status === "converted") {
        logStep("Slot already booked");
        return new Response(
          JSON.stringify({ error: "This slot has already been booked. Please select another time." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      
      if (existingHold.status === "active" && new Date(existingHold.expires_at) > new Date()) {
        logStep("Slot is currently held by another user");
        return new Response(
          JSON.stringify({ error: "This slot is currently being held by another user. Please select another time or try again in a few minutes." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Expired hold - mark it as expired
      await supabase
        .from("booking_slot_holds")
        .update({ status: "expired" })
        .eq("id", existingHold.id);
      
      logStep("Expired hold marked as expired", { holdId: existingHold.id });
    }

    // Create new hold
    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000).toISOString();
    
    const holdData: any = {
      booking_request_id,
      event_date,
      start_time: selected_time,
      end_time,
      status: "active",
      expires_at: expiresAt,
    };

    // Set identifiers based on mode
    if (campaign_mode) {
      holdData.campaign_id = campaign_id;
      holdData.package_id = package_id || null;
      holdData.product_id = null;
    } else {
      holdData.product_id = product_id;
    }

    const { data: newHold, error: holdError } = await supabase
      .from("booking_slot_holds")
      .insert(holdData)
      .select()
      .single();

    if (holdError) {
      logStep("Hold creation failed", { error: holdError.message });
      // Unique constraint violation
      if (holdError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "This slot was just taken. Please select another time." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
      throw holdError;
    }

    logStep("Hold created", { holdId: newHold.id, expiresAt });

    // Update booking request with checkout started stage and package_id
    const bookingRequestUpdate: any = { 
      stage: "checkout_started", 
      selected_time 
    };
    if (package_id) {
      bookingRequestUpdate.package_id = package_id;
    }
    
    await supabase
      .from("booking_requests")
      .update(bookingRequestUpdate)
      .eq("id", booking_request_id);

    logStep("Booking request updated to checkout_started");

    // Create Stripe checkout session
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get user email if logged in
    let customerEmail: string | undefined;
    if (user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(user_id);
      customerEmail = userData?.user?.email;
    }

    const origin = req.headers.get("origin") || "https://everafter.lovable.app";
    
    // Determine cancel URL based on mode
    const cancelUrl = campaign_mode 
      ? `${origin}/promo/${campaign_slug}?booking_cancelled=true`
      : `${origin}/services?booking_cancelled=true`;

    // Build product description
    const productDescription = campaign_mode 
      ? `Deposit for ${product_title} on ${event_date} at ${selected_time}`
      : `Booking for ${event_date} at ${selected_time}`;
    
    // Set Stripe checkout session to expire in 60 minutes
    const stripeExpiryMinutes = 60;
    logStep("Stripe session config", { holdMinutes, stripeExpiryMinutes, cancelUrl });

    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: chargeCurrency,
            product_data: {
              name: product_title,
              description: productDescription,
            },
            unit_amount: Math.round(chargeAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_request_id=${booking_request_id}`,
      cancel_url: cancelUrl,
      metadata: {
        booking_request_id,
        product_id: product_id || "",
        event_date,
        selected_time,
        hold_id: newHold.id,
        user_id: user_id || "",
        visitor_id: visitor_id || "",
        // Campaign metadata
        campaign_mode: campaign_mode ? "true" : "false",
        campaign_id: campaign_id || "",
        campaign_slug: campaign_slug || "",
        // NEW: Package metadata
        package_id: package_id || "",
        minimum_deposit_cents: minimum_deposit_cents?.toString() || "",
        // Legacy: card_index for backward compatibility
        card_index: card_index?.toString() || "",
        payment_type: campaign_mode ? "campaign_deposit" : "full",
      },
      expires_at: Math.floor(Date.now() / 1000) + stripeExpiryMinutes * 60,
    });

    logStep("Stripe session created", { sessionId: session.id, url: session.url });

    // Update booking request with Stripe session ID
    await supabase
      .from("booking_requests")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking_request_id);

    return new Response(
      JSON.stringify({ url: session.url, hold_id: newHold.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
