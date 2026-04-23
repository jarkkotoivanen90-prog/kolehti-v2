import { supabase } from "./_supabaseAdmin.js";
import { getProfileFromRequest } from "./_getProfile.js";
import { voteWeight } from "./lib/antiCheat.js";
import { voteWeightFromReputation, voteDelta } from "./lib/reputationEngine.js";
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
    if (!hasActiveSubscription(profile)) return res.status(403).json({ error: "Jäsenyys vaaditaan äänestämiseen" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { postId, drawType = "day", accountAgeHours = 24, priorVotes = 0, suspicious = false } = body;
    if (!postId) return res.status(400).json({ error: "postId vaaditaan" });

    const draw = await getActiveDraw(drawType);
    if (!draw) return res.status(400).json({ error: "Aktiivista kierrosta ei löytynyt" });

    const { data: existingVote, error: existingVoteError } = await supabase.from("votes").select("id").eq("draw_id", draw.id).eq("post_id", postId).eq("profile_id", profile.id).maybeSingle();
    if (existingVoteError) throw existingVoteError;
    if (existingVote) return res.status(400).json({ error: "Olet jo äänestänyt tätä perustelua" });

    const antiCheatWeight = voteWeight({ accountAgeHours, priorVotes, suspicious });
    const repWeight = voteWeightFromReputation(Number(profile.reputation_score || 0.5));
    const weight = Number((antiCheatWeight * repWeight).toFixed(3));

    const { error: voteError } = await supabase.from("votes").insert({ draw_id: draw.id, post_id: postId, profile_id: profile.id, value: weight, source: "user" });
    if (voteError) throw voteError;

    const { data: post, error: postError } = await supabase.from("posts").select("id, votes").eq("id", postId).maybeSingle();
    if (postError) throw postError;
    if (!post) return res.status(404).json({ error: "Perustelua ei löytynyt" });

    const { error: updateError } = await supabase.from("posts").update({ votes: Number(post.votes || 0) + weight }).eq("id", postId);
    if (updateError) throw updateError;

    const rep = await updateProfileReputation(profile.id, () => ({
      eventType: "vote_cast",
      delta: voteDelta({ suspicious, duplicateVote: false }),
      extraFields: { last_vote_at: new Date().toISOString() },
      meta: { postId, applied_weight: weight },
    }));

    res.json({ ok: true, applied_weight: weight, reputation: rep });
  } catch (error) {
    console.error("vote error:", error);
    res.status(500).json({ error: error.message || "vote failed" });
  }
}
