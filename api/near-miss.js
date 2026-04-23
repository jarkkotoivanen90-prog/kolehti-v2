import { supabase } from "./_supabaseAdmin.js";
import { getProfileFromRequest } from "./_getProfile.js";

export default async function handler(req, res) {
  try {
    const profile = await getProfileFromRequest(req);
    const { data: posts, error } = await supabase.from("posts").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(1);
    if (error) throw error;
    if (!posts?.length) return res.json({ ok: true, near_miss: null });

    const last = posts[0];
    const { data: all, error: allError } = await supabase.from("posts").select("*").eq("draw_id", last.draw_id);
    if (allError) throw allError;

    const sorted = (all || []).sort((a, b) => Number(b.final_score || 0) - Number(a.final_score || 0));
    const rank = sorted.findIndex((p) => p.id === last.id) + 1;
    const winner = sorted[0];
    if (!rank || rank <= 1) return res.json({ ok: true, near_miss: null });

    const diff = Number((Number(winner.final_score || 0) - Number(last.final_score || 0)).toFixed(3));
    res.json({ ok: true, near_miss: { rank, difference: diff, message: `Olit sijalla #${rank} ja jäit ${diff} pisteen päähän voittajasta.` } });
  } catch (error) {
    res.status(500).json({ error: error.message || "near miss failed" });
  }
}
