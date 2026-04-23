import Stripe from "stripe";
import { supabase } from "../_supabaseAdmin.js";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export default async function handler(req, res) {
  try {
    if (!stripe) return res.status(500).json({ error: "Missing Stripe key" });
    const event = req.body;
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const profileId = session.metadata.profile_id;
      await supabase.from("profiles").update({ subscription_status: "active" }).eq("id", profileId);
    }
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "webhook failed" });
  }
}
