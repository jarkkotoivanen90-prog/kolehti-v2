// Supabase Edge Function: buy-boost
// Handles boost purchase logic in dark-launch/mock mode.
// Real Stripe verification can be added later before enabling live payments.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { user_id, post_id, boost_type = "daily" } = await req.json();

    if (!user_id || !post_id) {
      return new Response(JSON.stringify({ error: "Missing user_id or post_id" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing, error: existingError } = await supabase
      .from("boost_purchases")
      .select("sequence_number")
      .eq("user_id", user_id)
      .eq("post_id", post_id)
      .eq("boost_type", boost_type)
      .order("sequence_number", { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    const nextSequence = (existing?.[0]?.sequence_number || 0) + 1;

    const { data: priceData, error: priceError } = await supabase.rpc("kolehti_boost_price_cents", {
      boost_type,
      sequence_number: nextSequence,
    });

    if (priceError) throw priceError;

    const amount_cents = Number(priceData || 0);

    const { data: boostValueData, error: boostValueError } = await supabase.rpc("kolehti_boost_value", {
      amount_cents,
    });

    if (boostValueError) throw boostValueError;

    const boost_value = Number(boostValueData || 0);

    const { error: purchaseError } = await supabase.from("boost_purchases").insert({
      user_id,
      post_id,
      boost_type,
      sequence_number: nextSequence,
      amount_cents,
      boost_value,
    });

    if (purchaseError) throw purchaseError;

    // Atomic SQL helper fixes the previous invalid `boost_score + x` update pattern.
    const { data: nextBoostScore, error: incrementError } = await supabase.rpc("increment_boost_score", {
      target_post_id: post_id,
      target_user_id: user_id,
      boost_value,
      amount_cents,
    });

    if (incrementError) throw incrementError;

    const { error: paymentError } = await supabase.from("payments").insert({
      user_id,
      post_id,
      type: "boost",
      amount_cents,
      status: "paid",
      meta: { mock: true, boost_type, sequence_number: nextSequence },
    });

    if (paymentError) throw paymentError;

    return new Response(
      JSON.stringify({ success: true, amount_cents, boost_value, boost_score: nextBoostScore }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 });
  }
});
