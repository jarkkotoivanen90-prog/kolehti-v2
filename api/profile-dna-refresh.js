import { supabase } from "./_supabaseAdmin.js";
import { getProfileFromRequest } from "./_getProfile.js";
import { detectPlayerDNA } from "./lib/playerDna.js";

export default async function handler(req, res) {
  try {
    const profile = await getProfileFromRequest(req);
    const { data: posts, error } = await supabase.from("posts").select("body").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    const dna = detectPlayerDNA(posts || []);
    await supabase.from("profiles").update({ player_dna: dna.player_dna, persuasion_style: dna.persuasion_style }).eq("id", profile.id);
    res.json({ ok: true, dna });
  } catch (error) {
    res.status(500).json({ error: error.message || "dna refresh failed" });
  }
}
