import { supabase } from "../_supabaseAdmin.js";

const names = ["Matti","Teemu","Sari","Laura","Jari","Kaisa","Ville","Anna","Petri","Mikko"];

export default async function handler(req, res) {
  try {
    for (let i = 0; i < 20; i++) {
      await supabase.from("profiles").insert({
        display_name: `${names[i % names.length]} ${i}`,
        subscription_status: "active",
        is_test_user: true,
        is_bot: true,
        reputation_score: Number((0.5 + Math.random() * 0.3).toFixed(3)),
        invite_code: `test${1000+i}`,
        invite_count: Math.floor(Math.random() * 5),
        invite_score: Number((Math.random() * 0.2).toFixed(3)),
      });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "seed failed" });
  }
}
