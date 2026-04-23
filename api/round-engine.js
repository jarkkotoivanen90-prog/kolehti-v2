import { requireCronSecret } from "./_requireCronSecret.js";
import { processRoundType } from "./lib/roundEngine.js";

export default async function handler(req, res) {
  try {
    requireCronSecret(req);
    const results = await Promise.all([processRoundType("day"), processRoundType("week"), processRoundType("month")]);
    res.json({ ok: true, results });
  } catch (error) {
    console.error("round-engine error:", error);
    res.status(error.statusCode || 500).json({ ok: false, error: error.message || "round engine failed" });
  }
}
