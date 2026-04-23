import { supabase } from "./_supabaseAdmin.js";
import { getProfileFromRequest } from "./_getProfile.js";

export default async function handler(req, res) {
  try {
    const profile = await getProfileFromRequest(req);
    const { data, error } = await supabase.from("reputation_events").select("event_type, delta, previous_score, new_score, created_at").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message || "history failed" });
  }
}
