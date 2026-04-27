import { createClient } from "@supabase/supabase-js";

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
}

function endOfWeek(start) {
  const d = new Date(start);
  d.setDate(d.getDate() + 7);
  return d;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  const currentWeek = startOfWeek(now);
  const previousWeekStart = new Date(currentWeek);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const previousWeekEnd = endOfWeek(previousWeekStart);

  const periodStart = isoDate(previousWeekStart);
  const periodEnd = isoDate(previousWeekEnd);

  const { data: existing } = await supabase
    .from("competition_winners")
    .select("id")
    .eq("period_type", "weekly")
    .eq("period_start", periodStart)
    .maybeSingle();

  if (existing) {
    return res.status(200).json({ ok: true, message: "weekly winner already exists" });
  }

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id,user_id,group_id,votes,created_at,eligible_weekly,paid_day_entry")
    .eq("is_bot", false)
    .eq("eligible_weekly", true)
    .eq("paid_day_entry", false)
    .gte("created_at", previousWeekStart.toISOString())
    .lt("created_at", previousWeekEnd.toISOString())
    .order("votes", { ascending: false })
    .limit(20);

  if (postsError) return res.status(500).json({ ok: false, error: postsError.message });
  if (!posts?.length) return res.status(200).json({ ok: true, message: "no eligible posts" });

  const candidates = [];

  for (const post of posts) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,winner_week,weekly_win_count")
      .eq("id", post.user_id)
      .maybeSingle();

    const lastWinnerWeek = profile?.winner_week ? new Date(profile.winner_week) : null;
    const blocked = lastWinnerWeek && lastWinnerWeek >= new Date(previousWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (!blocked) candidates.push({ post, profile });
  }

  const winner = candidates[0] || null;

  if (!winner) {
    return res.status(200).json({ ok: true, message: "all candidates blocked by weekly cooldown" });
  }

  const winnerPost = winner.post;
  const votes = Number(winnerPost.votes || 0);

  const { error: insertError } = await supabase.from("competition_winners").insert({
    user_id: winnerPost.user_id,
    post_id: winnerPost.id,
    group_id: winnerPost.group_id,
    period_type: "weekly",
    period_start: periodStart,
    period_end: periodEnd,
    votes,
    reward_label: "Viikkopotti",
  });

  if (insertError) return res.status(500).json({ ok: false, error: insertError.message });

  await supabase
    .from("profiles")
    .update({
      winner_week: periodStart,
      weekly_win_count: Number(winner.profile?.weekly_win_count || 0) + 1,
    })
    .eq("id", winnerPost.user_id);

  return res.status(200).json({ ok: true, winner: winnerPost.user_id, votes });
}
