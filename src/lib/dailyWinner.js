import { supabase } from "./supabaseClient";
import { addXP } from "./progression";

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayWinner() {
  const today = todayKey();

  const { data } = await supabase
    .from("daily_winners")
    .select("*")
    .eq("winner_date", today)
    .maybeSingle();

  return data || null;
}

export async function selectDailyWinner(posts = []) {
  const today = todayKey();

  const existing = await getTodayWinner();
  if (existing) return existing;

  if (!posts.length) return null;

  const winner = [...posts].sort((a, b) => {
    const scoreA =
      Number(a.viral_score || a.for_you_score || a.rank_score || 0) +
      Number(a.vote_count || a.votes || 0) * 100 +
      Number(a.ai_score || 0) * 2;

    const scoreB =
      Number(b.viral_score || b.for_you_score || b.rank_score || 0) +
      Number(b.vote_count || b.votes || 0) * 100 +
      Number(b.ai_score || 0) * 2;

    return scoreB - scoreA;
  })[0];

  if (!winner?.id || !winner?.user_id) return null;

  const score =
    Number(winner.viral_score || winner.for_you_score || winner.rank_score || 0) +
    Number(winner.vote_count || winner.votes || 0) * 100 +
    Number(winner.ai_score || 0) * 2;

  const { data, error } = await supabase
    .from("daily_winners")
    .insert({
      winner_date: today,
      post_id: winner.id,
      user_id: winner.user_id,
      score,
      vote_count: Number(winner.vote_count || winner.votes || 0),
      reward_xp: 100,
    })
    .select("*")
    .single();

  if (error) {
    console.error("selectDailyWinner error:", error);
    return null;
  }

  await supabase
    .from("posts")
    .update({
      daily_winner: true,
      boost_score: Number(winner.boost_score || 0) + 25,
    })
    .eq("id", winner.id);

  await addXP(winner.user_id, 100, "daily_winner");

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_wins")
    .eq("id", winner.user_id)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({
      daily_wins: Number(profile?.daily_wins || 0) + 1,
      winner_badge: "👑 Päivän voittaja",
      active_badge: "👑 Päivän voittaja",
    })
    .eq("id", winner.user_id);

  await supabase.from("notifications").insert({
    user_id: winner.user_id,
    type: "daily_winner",
    title: "👑 Voitit päivän kierroksen!",
    body: "Perustelusi nousi päivän voittajaksi. Sait +100 XP.",
    meta: {
      post_id: winner.id,
      reward_xp: 100,
      winner_date: today,
    },
  });

  return data;
}
