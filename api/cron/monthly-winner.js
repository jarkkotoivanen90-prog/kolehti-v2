import { createClient } from "@supabase/supabase-js";

function monthStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isoDay(d) {
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  const thisMonth = monthStart(now);
  const previousMonth = new Date(thisMonth);
  previousMonth.setMonth(previousMonth.getMonth() - 1);

  const periodStart = isoDay(previousMonth);
  const periodEnd = isoDay(thisMonth);

  const { data: existing } = await supabase
    .from("competition_winners")
    .select("id")
    .eq("period_type", "monthly")
    .eq("period_start", periodStart)
    .maybeSingle();

  if (existing) {
    return res.status(200).json({ ok: true, message: "monthly winner already selected" });
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id,user_id,group_id,votes,created_at")
    .eq("is_bot", false)
    .eq("eligible_monthly", true)
    .gte("created_at", previousMonth.toISOString())
    .lt("created_at", thisMonth.toISOString())
    .order("votes", { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  if (!posts?.length) return res.status(200).json({ ok: true, message: "no monthly candidates" });

  const winner = posts[0];

  const { error: insertError } = await supabase.from("competition_winners").insert({
    user_id: winner.user_id,
    post_id: winner.id,
    group_id: winner.group_id,
    period_type: "monthly",
    period_start: periodStart,
    period_end: periodEnd,
    votes: Number(winner.votes || 0),
    reward_label: "Kuukausipotti"
  });

  if (insertError) return res.status(500).json({ ok: false, error: insertError.message });

  await supabase
    .from("profiles")
    .update({ winner_month: periodStart })
    .eq("id", winner.user_id);

  return res.status(200).json({ ok: true, winner: winner.user_id });
}
