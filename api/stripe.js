import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { action } = req.query;

  if (process.env.STRIPE_ENABLED !== "true") {
    return res.status(403).json({ error: "disabled" });
  }

  if (action === "checkout") {
    const { type, postId, userId } = req.body || {};

    let price = null;
    if (type === "daily") price = process.env.STRIPE_DAILY_PRICE_ID;
    if (type === "subscription") price = process.env.STRIPE_SUB_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      mode: type === "subscription" ? "subscription" : "payment",
      payment_method_types: ["card"],
      line_items: [{ price, quantity: 1 }],
      success_url: `${process.env.APP_URL}/success`,
      cancel_url: `${process.env.APP_URL}/cancel`,
      client_reference_id: userId,
      metadata: { type, postId },
    });

    return res.json({ url: session.url });
  }

  if (action === "webhook") {
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
      return res.status(400).send("Webhook error");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.client_reference_id;
      const type = session.metadata?.type;
      const postId = session.metadata?.postId;

      if (type === "daily") {
        await supabase.from("user_entitlements").insert({ user_id: userId, type: "daily" });
      }

      if (type === "subscription") {
        await supabase.from("user_entitlements").insert({ user_id: userId, type: "subscription" });
      }

      if (type === "boost") {
        await supabase.rpc("increment_boost_score", { target_post_id: postId });
      }
    }

    return res.json({ ok: true });
  }

  return res.status(400).json({ error: "invalid action" });
}
