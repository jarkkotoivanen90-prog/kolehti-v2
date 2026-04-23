import { supabase } from "./_supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    const drawType = req.query?.drawType || "day";
    const { data: latestClosed, error: drawError } = await supabase.from("draws").select("id, type, title, closed_at").eq("type", drawType).eq("status", "closed").order("closed_at", { ascending: false }).limit(1).maybeSingle();
    if (drawError) throw drawError;
    if (!latestClosed) return res.json({ ok: true, result: null });
    const { data: result, error: resultError } = await supabase.from("draw_results").select("*").eq("draw_id", latestClosed.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (resultError) throw resultError;
    res.json({ ok: true, result: result ? { ...result, draw_title: latestClosed.title, draw_type: latestClosed.type, closed_at: latestClosed.closed_at } : null });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "result fetch failed" });
  }
}
