import { supabase } from "../_supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { display_name, auth_user_id, inviteCode = null } = body;
    let invited_by = null;

    if (inviteCode && process.env.GROWTH_ENABLED === "true") {
      const { data: inviter } = await supabase.from("profiles").select("id").eq("invite_code", inviteCode).maybeSingle();
      invited_by = inviter?.id || null;
    }

    const { data: profile, error } = await supabase.from("profiles").insert({
      display_name,
      auth_user_id,
      invited_by,
    }).select("*").single();

    if (error) throw error;

    if (invited_by) {
      await supabase.from("invites").insert({ inviter_id: invited_by, invited_id: profile.id });
    }

    res.json({ ok: true, profile });
  } catch (error) {
    res.status(500).json({ error: error.message || "register failed" });
  }
}
