import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const raw = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });

    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send("Webhook Error");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId = session.client_reference_id;
    const type = session.metadata?.type;
    const postId = session.metadata?.postId;

    if (type === "daily") {
      await supabase.from("user_entitlements").insert({
        user_id: userId,
        type: "daily",
        valid_until: new Date(Date.now() + 86400000),
        source: "stripe",
      });
    }

    if (type === "subscription") {
      await supabase.from("user_entitlements").insert({
        user_id: userId,
        type: "subscription",
        source: "stripe",
      });
    }

    if (type === "boost") {
      await supabase.from("boost_purchases").insert({
        user_id: userId,
        post_id: postId,
        amount: session.amount_total / 100,
        boost_value: 1,
        stripe_session_id: session.id,
      });

      await supabase.rpc("increment_boost_score", { target_post_id: postId });
    }
  }

  res.json({ received: true });
}
