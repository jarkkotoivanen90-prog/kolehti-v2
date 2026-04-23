import { supabase } from "./_supabaseAdmin.js";
import { getProfileFromRequest } from "./_getProfile.js";
import { computePersonalizedFeedScore, explainPersonalizedFeed } from "./lib/personalizedFeed.js";
import { getConfig } from "./lib/config.js";

async function getActiveDraw(drawType) {
  const { data, error } = await supabase.from("draws").select("id").eq("type", drawType).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

function stableBucket(profileId = "", trafficSplitAi = 50) {
  let hash = 0;
  for (let i = 0; i < String(profileId).length; i++) hash = (hash * 31 + String(profileId).charCodeAt(i)) % 100;
  return hash < trafficSplitAi ? "ai" : "vote";
}

export default async function handler(req, res) {
  try {
    const drawType = req.query?.drawType || "day";
    const featureFlags = await getConfig("feature_flags", { ai_feed_enabled: false, personalized_feed_enabled: false, shadow_moderation_enabled: false, growth_feed_bonus_enabled: false });
    const abTest = await getConfig("ab_test", { enabled: false, traffic_split_ai: 50 });
    const activeDraw = await getActiveDraw(drawType);
    if (!activeDraw) return res.json([]);

    let viewerProfile = null;
    try { viewerProfile = await getProfileFromRequest(req); } catch {}

    const { data: posts, error } = await supabase.from("posts").select(`
      id, profile_id, title, body, votes, ai_score, quality_score, visibility_score, boost_visibility, boost_count,
      moderation_status, feed_score, feed_rank, feed_explanation, shadow_status, shadow_reason, is_bot_generated,
      audience_fit_score, hook_score, reason_summary, created_at,
      profile:profiles(display_name, is_bot, reputation_score, trust_level, invite_score)
    `).eq("draw_id", activeDraw.id).eq("status", "active").limit(100);
    if (error) throw error;

    let mapped = (posts || []).map((post) => ({
      id: post.id,
      profile_id: post.profile_id,
      text: post.body,
      body: post.body,
      title: post.title,
      votes: post.votes || 0,
      ai_score: post.ai_score || 0,
      quality_score: post.quality_score || 0,
      moderation_status: post.moderation_status,
      boost_count: post.boost_count || 0,
      boost_visibility: post.boost_visibility || 0,
      audience_fit_score: post.audience_fit_score || 0,
      hook_score: post.hook_score || 0,
      reason_summary: post.reason_summary || "",
      display_name: post.profile?.display_name || "Käyttäjä",
      is_bot: post.profile?.is_bot || false,
      reputation_score: post.profile?.reputation_score || 0.5,
      trust_level: post.profile?.trust_level || "new",
      feed_score: post.feed_score || 0,
      feed_rank: post.feed_rank || null,
      feed_explanation: post.feed_explanation || "",
      shadow_status: post.shadow_status || "visible",
      shadow_reason: post.shadow_reason || "",
      created_at: post.created_at,
      _profile: post.profile || {},
    }));

    if (featureFlags.shadow_moderation_enabled) mapped = mapped.filter((p) => p.shadow_status !== "limited");

    let mode = "vote";
    if (abTest.enabled && viewerProfile?.id) mode = stableBucket(viewerProfile.id, Number(abTest.traffic_split_ai || 50));
    else if (featureFlags.personalized_feed_enabled && viewerProfile) mode = "personalized";
    else if (featureFlags.ai_feed_enabled) mode = "ai";

    if (mode === "personalized" && viewerProfile) {
      mapped = mapped.map((post) => ({
        ...post,
        personalized_score: computePersonalizedFeedScore({ ...post, profile: post._profile, body: post.text }, viewerProfile),
        personalized_explanation: explainPersonalizedFeed({ ...post, profile: post._profile, body: post.text }, viewerProfile),
      })).sort((a, b) => b.personalized_score - a.personalized_score);
    } else if (mode === "ai") {
      mapped = mapped.sort((a, b) => (b.feed_score || 0) - (a.feed_score || 0));
    } else {
      mapped = mapped.sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0) || Number(b.ai_score || 0) - Number(a.ai_score || 0));
    }

    res.json(mapped.map(({ _profile, ...rest }) => ({ ...rest, delivery_mode: mode })));
  } catch (error) {
    console.error("leaderboard error:", error);
    res.status(500).json({ error: error.message || "leaderboard failed" });
  }
}
