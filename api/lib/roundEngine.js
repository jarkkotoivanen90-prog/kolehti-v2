import { supabase } from "../_supabaseAdmin.js";
import { buildReasonEngineResult } from "./reasonEngine.js";
import { buildRoundInsight } from "./collectiveIntelligence.js";

export function calculateFinalScore(post) {
  const votes = Number(post.votes || 0);
  const ai = Number(post.ai_score || 0);
  const visibility = 1 + Number(post.boost_visibility || 0);
  return Number((votes * 0.72 + ai * 10 * 0.23 + visibility * 0.05).toFixed(4));
}

export async function processRoundType(type) {
  const { data: draw, error: drawError } = await supabase.from("draws").select("*").eq("type", type).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (drawError) throw drawError;
  if (!draw) return { type, action: "no_active_draw" };
  if (new Date(draw.ends_at) > new Date()) return { type, action: "still_active", draw_id: draw.id };

  const { data: posts, error: postsError } = await supabase.from("posts").select("*").eq("draw_id", draw.id).eq("status", "active");
  if (postsError) throw postsError;

  let winner = null;
  const ranked = (posts || []).map((post) => ({ ...post, final_score: calculateFinalScore(post) })).sort((a, b) => b.final_score - a.final_score);
  if (ranked.length) {
    winner = ranked[0];
    const reason = buildReasonEngineResult(winner);
    const { error: winnerError } = await supabase.from("posts").update({ status: "winner", final_score: winner.final_score, reason_summary: reason.reason_summary, win_reason: reason.win_reason }).eq("id", winner.id);
    if (winnerError) throw winnerError;
    const { error: resultError } = await supabase.from("draw_results").insert({
      draw_id: draw.id, draw_type: type, post_id: winner.id, profile_name: winner.title || "Voittaja",
      final_score: winner.final_score, votes: winner.votes || 0, ai_score: winner.ai_score || 0,
      summary: winner.body || "", reason_summary: reason.reason_summary
    });
    if (resultError) throw resultError;
    const insight = buildRoundInsight(ranked);
    await supabase.from("round_insights").insert({ draw_id: draw.id, insight_type: insight.insight_type, content: insight.content, data: insight.data });
  }

  const { error: closeError } = await supabase.from("draws").update({ status: "closed", closed_at: new Date().toISOString(), winner_post_id: winner?.id || null }).eq("id", draw.id);
  if (closeError) throw closeError;

  const nextEnd = new Date();
  if (type === "day") nextEnd.setDate(nextEnd.getDate() + 1);
  if (type === "week") nextEnd.setDate(nextEnd.getDate() + 7);
  if (type === "month") nextEnd.setMonth(nextEnd.getMonth() + 1);

  const { data: nextDraw, error: nextError } = await supabase.from("draws").insert({ type, title: `${type} kierros`, status: "active", starts_at: new Date().toISOString(), ends_at: nextEnd.toISOString() }).select("*").single();
  if (nextError) throw nextError;

  return { type, action: "finalized", winner_post_id: winner?.id || null, next_draw_id: nextDraw.id };
}
