import { supabase } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    await supabase.from("analytics_events").insert({ event: body.event, data: body.data || {}, created_at: new Date().toISOString() });
    res.json({ ok: true });
  } catch {
    res.json({ ok: false });
  }
}
