// Supabase Edge Function: buy-boost
// Handles boost purchase logic (without external payment provider for now)

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { user_id, post_id, boost_type } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine next sequence number for this user/post/type
    const { data: existing } = await supabase
      .from("boost_purchases")
      .select("sequence_number")
      .eq("user_id", user_id)
      .eq("post_id", post_id)
      .eq("boost_type", boost_type)
      .order("sequence_number", { ascending: false })
      .limit(1);

    const nextSequence = (existing?.[0]?.sequence_number || 0) + 1;

    // Get price from SQL function
    const { data: priceData, error: priceError } = await supabase.rpc("kolehti_boost_price_cents", {
      boost_type,
      sequence_number: nextSequence
    });

    if (priceError) throw priceError;

    const amount_cents = priceData as number;

    // Compute boost value
    const { data: boostValueData } = await supabase.rpc("kolehti_boost_value", {
      amount_cents
    });

    const boost_value = Number(boostValueData || 0);

    // Persist purchase
    await supabase.from("boost_purchases").insert({
      user_id,
      post_id,
      boost_type,
      sequence_number: nextSequence,
      amount_cents,
      boost_value
    });

    // Update post and profile
    await supabase.from("posts").update({
      boost_score: (Number as any)(`boost_score + ${boost_value}`)
    }).eq("id", post_id);

    await supabase.from("profiles").update({
      total_boost_spent: (Number as any)(`total_boost_spent + ${amount_cents / 100}`)
    }).eq("id", user_id);

    // Record payment (mock)
    await supabase.from("payments").insert({
      user_id,
      post_id,
      type: "boost",
      amount_cents,
      status: "paid"
    });

    return new Response(JSON.stringify({ success: true, amount_cents, boost_value }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
