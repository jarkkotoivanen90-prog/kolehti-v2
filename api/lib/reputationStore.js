import { supabase } from "../_supabaseAdmin.js";
import { applyDelta, getTrustLevel } from "./reputationEngine.js";

export async function updateProfileReputation(profileId, updater) {
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error("Profile not found");
  const update = updater(profile);
  const nextScore = applyDelta(Number(profile.reputation_score || 0.5), update.delta || 0);
  const nextTrust = getTrustLevel(nextScore);
  const payload = {
    reputation_score: nextScore,
    trust_level: nextTrust,
    ...update.extraFields,
    last_active_at: new Date().toISOString(),
  };
  const { error: updateError } = await supabase.from("profiles").update(payload).eq("id", profileId);
  if (updateError) throw updateError;
  await supabase.from("reputation_events").insert({
    profile_id: profileId,
    event_type: update.eventType,
    delta: update.delta || 0,
    previous_score: Number(profile.reputation_score || 0.5),
    new_score: nextScore,
    meta: update.meta || {},
  });
  return { previous: Number(profile.reputation_score || 0.5), next: nextScore, trust: nextTrust };
}
