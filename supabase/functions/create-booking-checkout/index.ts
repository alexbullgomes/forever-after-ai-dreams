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
      user_id,
      visitor_id,
    } = body;

    logStep("Request body parsed", { booking_request_id, product_id, event_date, selected_time });

    // Fetch product booking rules for hold duration
    const { data: rules } = await supabase
      .from("product_booking_rules")
      .select("checkout_hold_minutes, slot_duration_minutes")
      .eq("product_id", product_id)
      .maybeSingle();

    const holdMinutes = rules?.checkout_hold_minutes ?? 15;
    const slotDuration = rules?.slot_duration_minutes ?? 60;
    
    logStep("Booking rules fetched", { holdMinutes, slotDuration });

    // Calculate end time
    const [hours, minutes] = selected_time.split(":").map(Number);
    const endMinutes = hours * 60 + minutes + slotDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const end_time = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

    logStep("End time calculated", { end_time });

    // Check for existing active/converted hold
    const { data: existingHold } = await supabase
      .from("booking_slot_holds")
      .select("id, status, expires_at")
      .eq("product_id", product_id)
      .eq("event_date", event_date)
      .eq("start_time", selected_time)
      .in("status", ["active", "converted"])
      .maybeSingle();

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
    
    const { data: newHold, error: holdError } = await supabase
      .from("booking_slot_holds")
      .insert({
        booking_request_id,
        product_id,
        event_date,
        start_time: selected_time,
        end_time,
        status: "active",
        expires_at: expiresAt,
      })
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

    // Update booking request with checkout started stage
    await supabase
      .from("booking_requests")
      .update({ stage: "checkout_started", selected_time })
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
    
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product_title,
              description: `Booking for ${event_date} at ${selected_time}`,
            },
            unit_amount: Math.round(product_price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&booking_request_id=${booking_request_id}`,
      cancel_url: `${origin}/services?booking_cancelled=true`,
      metadata: {
        booking_request_id,
        product_id,
        event_date,
        selected_time,
        hold_id: newHold.id,
        user_id: user_id || "",
        visitor_id: visitor_id || "",
      },
      expires_at: Math.floor(Date.now() / 1000) + holdMinutes * 60,
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
