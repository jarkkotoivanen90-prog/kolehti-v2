import { supabase } from "./_supabaseAdmin.js";
import { getProfileFromRequest } from "./_getProfile.js";
import { isSpam, similarityScore } from "./lib/antiCheat.js";
import { calculateAIScore } from "./lib/scoring.js";
import { moderatePost } from "./lib/moderation.js";
import { runShadowModeration } from "./lib/shadowModeration.js";
import { computeAudienceFit } from "./lib/audienceFit.js";
import { computeHookScore } from "./lib/hookScore.js";
import { buildMentorFeedback } from "./lib/mentorEngine.js";
import { visibilityBonusFromReputation, postDelta } from "./lib/reputationEngine.js";
import { updateProfileReputation } from "./lib/reputationStore.js";
import { hasActiveSubscription } from "./lib/subscription.js";

async function getActiveDraw(drawType) {
  const { data, error } = await supabase.from("draws").select("*").eq("type", drawType).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export default async function handler(req, res) {
  try {
    const profile = await getProfileFromRequest(req);
    if (!hasActiveSubscription(profile)) return res.status(403).json({ error: "Tarvitset aktiivisen jäsenyyden osallistuaksesi" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { text, drawType = "day" } = body;

    if (!text || isSpam(text)) return res.status(400).json({ error: "Virheellinen tai liian lyhyt perustelu" });

    const draw = await getActiveDraw(drawType);
    if (!draw) return res.status(400).json({ error: "Aktiivista kierrosta ei löytynyt" });

    const { data: recentPosts, error: recentError } = await supabase.from("posts").select("body").eq("draw_id", draw.id).order("created_at", { ascending: false }).limit(50);
    if (recentError) throw recentError;

    let duplicate = false;
    for (const post of recentPosts || []) {
      if (similarityScore(text, post.body || "") > 0.9) {
        duplicate = true;
        return res.status(400).json({ error: "Perustelu on liian samanlainen kuin olemassa oleva" });
      }
    }

    const [score, moderation, shadow] = await Promise.all([
      calculateAIScore(text),
      moderatePost(text),
      runShadowModeration({ body: text }),
    ]);

    if (moderation.moderation_status === "rejected") {
      await updateProfileReputation(profile.id, () => ({
        eventType: "post_rejected",
        delta: postDelta({ moderationStatus: "rejected", aiScore: 0, duplicate }),
        meta: { reason: moderation.moderation_reason },
      }));
      return res.status(400).json({ error: moderation.moderation_reason || "Perustelu hylättiin moderoinnissa" });
    }

    const audienceFit = computeAudienceFit({ body: text });
    const hookScore = computeHookScore(text);
    const visibilityBonus = visibilityBonusFromReputation(Number(profile.reputation_score || 0.5));

    const { data: inserted, error: insertError } = await supabase.from("posts").insert({
      draw_id: draw.id,
      profile_id: profile.id,
      title: `Perustelu • ${draw.title}`,
      body: text,
      votes: 0,
      ai_score: score.ai_score,
      final_score: 0,
      visibility_score: Number((1 + visibilityBonus).toFixed(3)),
      boost_visibility: 0,
      boost_count: 0,
      is_bot_generated: false,
      moderation_status: moderation.moderation_status,
      moderation_reason: moderation.moderation_reason,
      quality_score: moderation.quality_score,
      shadow_status: shadow.shadow_status,
      shadow_reason: shadow.shadow_reason,
      audience_fit_score: audienceFit,
      hook_score: hookScore,
      status: moderation.moderation_status === "approved" ? "active" : "review",
    }).select("*").single();
    if (insertError) throw insertError;

    const mentor = buildMentorFeedback({
      body: text,
      ai_score: score.ai_score,
      audience_fit_score: audienceFit,
      hook_score: hookScore,
    });

    await supabase.from("mentor_feedback").insert({
      profile_id: profile.id,
      post_id: inserted.id,
      feedback: mentor.feedback,
      strengths: mentor.strengths,
      improvements: mentor.improvements,
    });

    await supabase.from("moderation_events").insert({
      post_id: inserted.id,
      moderation_status: shadow.shadow_status,
      reason: shadow.shadow_reason,
    });

    const rep = await updateProfileReputation(profile.id, () => ({
      eventType: "post_created",
      delta: postDelta({ moderationStatus: moderation.moderation_status, aiScore: score.ai_score, duplicate }),
      extraFields: { last_post_at: new Date().toISOString() },
      meta: { ai_score: score.ai_score, moderation_status: moderation.moderation_status },
    }));

    res.json({ ok: true, post: inserted, score, moderation, mentor, reputation: rep });
  } catch (error) {
    console.error("submit-entry error:", error);
    res.status(500).json({ error: error.message || "submit failed" });
  }
}
