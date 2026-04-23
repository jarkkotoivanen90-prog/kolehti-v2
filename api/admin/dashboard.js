import { supabase } from "../_supabaseAdmin.js";
import { requireAdmin } from "../_requireAdmin.js";
import { computeFeedScore } from "../lib/feedRanking.js";
import { computePersonalizedFeedScore, explainPersonalizedFeed } from "../lib/personalizedFeed.js";
import { getConfig } from "../lib/config.js";

async function getActiveDraw(drawType = "day") {
  const { data, error } = await supabase.from("draws").select("*").eq("type", drawType).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}
function mapPost(post) {
  return {
    id: post.id, profile_id: post.profile_id, title: post.title, body: post.body,
    votes: Number(post.votes || 0), ai_score: Number(post.ai_score || 0), quality_score: Number(post.quality_score || 0),
    visibility_score: Number(post.visibility_score || 1), boost_visibility: Number(post.boost_visibility || 0),
    boost_count: Number(post.boost_count || 0), moderation_status: post.moderation_status || "unknown",
    shadow_status: post.shadow_status || "visible", shadow_reason: post.shadow_reason || "", feed_score: Number(post.feed_score || 0),
    feed_rank: post.feed_rank || null, feed_explanation: post.feed_explanation || "", created_at: post.created_at,
    display_name: post.profile?.display_name || "Käyttäjä", reputation_score: Number(post.profile?.reputation_score || 0.5),
    trust_level: post.profile?.trust_level || "new", invite_score: Number(post.profile?.invite_score || 0), is_bot: !!post.profile?.is_bot,
  };
}

export default async function handler(req, res) {
  try {
    const adminProfile = await requireAdmin(req);
    const drawType = req.query?.drawType || "day";
    const targetProfileId = req.query?.viewerProfileId || adminProfile.id;
    const activeDraw = await getActiveDraw(drawType);
    if (!activeDraw) return res.json({ draw: null, normal: [], ai: [], personalized: [], shadow_hidden: [], toggles: {}, feed_weights: {}, ab_test: {} });

    const { data: viewerProfile } = await supabase.from("profiles").select("*").eq("id", targetProfileId).maybeSingle();
    const { data: posts } = await supabase.from("posts").select(`*, profile:profiles(id, display_name, reputation_score, trust_level, invite_score, is_bot)`).eq("draw_id", activeDraw.id).in("status", ["active", "review"]).limit(200);

    const mapped = (posts || []).map(mapPost);
    const feedWeights = await getConfig("feed_weights", { ai: 0.32, quality: 0.18, engagement: 0.2, freshness: 0.15, trust: 0.1, visibility: 0.05 });
    const featureFlags = await getConfig("feature_flags", { ai_feed_enabled: false, personalized_feed_enabled: false, shadow_moderation_enabled: false, growth_feed_bonus_enabled: false });
    const abTest = await getConfig("ab_test", { enabled: false, traffic_split_ai: 50 });

    const normal = [...mapped].sort((a, b) => b.votes - a.votes || b.ai_score - a.ai_score).slice(0, 20);
    const ai = [...mapped].map((p) => ({ ...p, dashboard_ai_score: computeFeedScore(p, { reputation_score: p.reputation_score, trust_level: p.trust_level, invite_score: p.invite_score }, feedWeights) })).sort((a, b) => b.dashboard_ai_score - a.dashboard_ai_score).slice(0, 20);
    const personalized = [...mapped].map((p) => ({
      ...p,
      personalized_score: computePersonalizedFeedScore({ ...p, profile: { reputation_score: p.reputation_score, trust_level: p.trust_level, invite_score: p.invite_score }, body: p.body }, viewerProfile || null),
      personalized_explanation: explainPersonalizedFeed({ ...p, profile: { reputation_score: p.reputation_score, trust_level: p.trust_level, invite_score: p.invite_score }, body: p.body }, viewerProfile || null)
    })).sort((a, b) => b.personalized_score - a.personalized_score).slice(0, 20);
    const shadow_hidden = [...mapped].filter((p) => p.shadow_status === "limited").slice(0, 20);

    res.json({
      draw: { id: activeDraw.id, type: activeDraw.type, title: activeDraw.title, ends_at: activeDraw.ends_at },
      viewer_profile: viewerProfile ? { id: viewerProfile.id, display_name: viewerProfile.display_name, reputation_score: viewerProfile.reputation_score, trust_level: viewerProfile.trust_level } : null,
      normal, ai, personalized, shadow_hidden, toggles: featureFlags, feed_weights: feedWeights, ab_test: abTest
    });
  } catch (error) {
    console.error("admin dashboard error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "dashboard failed" });
  }
}
