import { supabase } from "./_supabaseAdmin.js";
import { requireCronSecret } from "./_requireCronSecret.js";
import { computeFeedScore, explainFeedScore } from "./lib/feedRanking.js";
import { getConfig } from "./lib/config.js";

export default async function handler(req, res) {
  try {
    requireCronSecret(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const drawType = body.drawType || "day";

    const { data: draw, error: drawError } = await supabase.from("draws").select("*").eq("type", drawType).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (drawError) throw drawError;
    if (!draw) return res.status(400).json({ ok: false, error: "Aktiivista kierrosta ei löytynyt" });

    const weights = await getConfig("feed_weights", { ai: 0.32, quality: 0.18, engagement: 0.20, freshness: 0.15, trust: 0.10, visibility: 0.05 });

    const { data: posts, error: postsError } = await supabase.from("posts").select(`*, profile:profiles(id, display_name, reputation_score, trust_level, invite_score)`).eq("draw_id", draw.id).eq("status", "active");
    if (postsError) throw postsError;

    const ranked = (posts || []).map((post) => {
      let feedScore = computeFeedScore(post, post.profile, weights);
      if ((process.env.GROWTH_FEED_BONUS_ENABLED === "true")) {
        const inviteBonus = Math.min(0.04, Number(post.profile?.invite_score || 0) * 0.15);
        feedScore = Number((feedScore + inviteBonus).toFixed(4));
      }
      return { ...post, _feed_score: feedScore, _feed_explanation: explainFeedScore(post, post.profile) };
    }).sort((a, b) => b._feed_score - a._feed_score);

    for (let i = 0; i < ranked.length; i++) {
      const post = ranked[i];
      const { error: updateError } = await supabase.from("posts").update({ feed_score: post._feed_score, feed_rank: i + 1, feed_explanation: post._feed_explanation }).eq("id", post.id);
      if (updateError) throw updateError;
    }

    res.json({ ok: true, ranked_count: ranked.length, weights });
  } catch (error) {
    console.error("feed-rank error:", error);
    res.status(error.statusCode || 500).json({ ok: false, error: error.message || "feed rank failed" });
  }
}
