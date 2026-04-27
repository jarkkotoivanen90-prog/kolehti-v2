import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("daily_winners")
    .select("*")
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    return res.json({ message: "already exists" });
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*");

  if (!posts?.length) return res.json({ message: "no posts" });

  const winner = posts.sort((a, b) =>
    (b.votes * 100 + b.ai_score) - (a.votes * 100 + a.ai_score)
  )[0];

  await supabase.from("daily_winners").insert({
    post_id: winner.id,
    user_id: winner.user_id,
    date: today,
  });

  await supabase.from("posts").update({
    is_daily_winner: true
  }).eq("id", winner.id);

  return res.json({ winner });
}
