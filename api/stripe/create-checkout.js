import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (process.env.STRIPE_ENABLED !== "true") {
    return res.status(403).json({ error: "Stripe disabled" });
  }

  const { type, postId, userId } = req.body || {};

  let price = null;

  if (type === "daily") price = process.env.STRIPE_DAILY_PRICE_ID;
  if (type === "subscription") price = process.env.STRIPE_SUB_PRICE_ID;

  if (!price) {
    return res.status(400).json({ error: "Invalid type" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: type === "subscription" ? "subscription" : "payment",
    payment_method_types: ["card"],
    line_items: [{ price, quantity: 1 }],
    success_url: `${process.env.APP_URL}/success`,
    cancel_url: `${process.env.APP_URL}/cancel`,
    client_reference_id: userId,
    metadata: {
      type,
      postId: postId || "",
    },
  });

  res.json({ url: session.url });
}
