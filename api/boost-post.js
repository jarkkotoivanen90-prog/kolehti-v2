import { supabase } from "./_supabaseAdmin.js";
import { getProfileFromRequest } from "./_getProfile.js";
import { boostMultiplierFromReputation } from "./lib/reputationEngine.js";

function calcBaseGain(boostCount = 0) {
  if (boostCount <= 0) return 0.2;
  if (boostCount === 1) return 0.14;
  if (boostCount === 2) return 0.1;
  if (boostCount === 3) return 0.07;
  return 0.04;
}

export default async function handler(req, res) {
  try {
    const profile = await getProfileFromRequest(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { postId } = body;
    if (!postId) return res.status(400).json({ error: "postId vaaditaan" });

    const { data: post, error: postError } = await supabase.from("posts").select("id, draw_id, profile_id, boost_count, boost_visibility").eq("id", postId).maybeSingle();
    if (postError) throw postError;
    if (!post) return res.status(404).json({ error: "Postia ei löytynyt" });
    if (post.profile_id !== profile.id) return res.status(403).json({ error: "Voit boostata vain omaa perusteluasi" });

    const count = Number(post.boost_count || 0);
    if (count >= 6) return res.status(400).json({ error: "Boost limit saavutettu" });

    const baseGain = calcBaseGain(count);
    const multiplier = boostMultiplierFromReputation(Number(profile.reputation_score || 0.5));
    const gain = Number((baseGain * multiplier).toFixed(3));

    await supabase.from("post_boosts").insert({
      post_id: post.id,
      profile_id: profile.id,
      draw_id: post.draw_id,
      visibility_gain: gain,
    });

    await supabase.from("posts").update({
      boost_count: count + 1,
      boost_visibility: Number((Number(post.boost_visibility || 0) + gain).toFixed(3)),
      boost_last_at: new Date().toISOString(),
    }).eq("id", post.id);

    res.json({ ok: true, visibility_gain: gain, multiplier, boost_count: count + 1 });
  } catch (error) {
    console.error("boost-post error:", error);
    res.status(500).json({ error: error.message || "boost failed" });
  }
}
