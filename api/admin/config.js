import { requireAdmin } from "../_requireAdmin.js";
import { getConfig, setConfig } from "../lib/config.js";

export default async function handler(req, res) {
  try {
    await requireAdmin(req);
    if (req.method === "GET") {
      const featureFlags = await getConfig("feature_flags", {});
      const feedWeights = await getConfig("feed_weights", {});
      const abTest = await getConfig("ab_test", {});
      return res.json({ feature_flags: featureFlags, feed_weights: feedWeights, ab_test: abTest });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      if (body.feature_flags) await setConfig("feature_flags", body.feature_flags);
      if (body.feed_weights) await setConfig("feed_weights", body.feed_weights);
      if (body.ab_test) await setConfig("ab_test", body.ab_test);
      return res.json({ ok: true });
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || "config failed" });
  }
}
