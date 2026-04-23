import Stripe from "stripe";
import { getProfileFromRequest } from "../_getProfile.js";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export default async function handler(req, res) {
  try {
    if (process.env.STRIPE_ENABLED !== "true") return res.status(400).json({ error: "Stripe disabled" });
    if (!stripe) return res.status(500).json({ error: "Missing Stripe key" });
    const profile = await getProfileFromRequest(req);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.APP_URL}/profile`,
      cancel_url: `${process.env.APP_URL}/profile`,
      metadata: { profile_id: profile.id },
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message || "stripe failed" });
  }
}
