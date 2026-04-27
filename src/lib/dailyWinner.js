import { supabase } from "./supabaseClient";
import { addXP } from "./progression";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodayWinner() {
  const today = todayKey();

  const { data, error } = await supabase
    .from("daily_winners")
    .select("*, posts(*)")
    .eq("date", today)
    .maybeSingle();

  if (error) {
    console.error("getTodayWinner error:", error);
    return null;
  }

  return data;
}

export function pickLocalDailyWinner(posts = []) {
  if (!posts.length) return null;

  return [...posts].sort((a, b) => {
    const scoreA =
      Number(a.vote_count || a.votes || 0) * 100 +
      Number(a.viral_score || 0) +
      Number(a.ai_score || 50);

    const scoreB =
      Number(b.vote_count || b.votes || 0) * 100 +
      Number(b.viral_score || 0) +
      Number(b.ai_score || 50);

    return scoreB - scoreA;
  })[0];
}

export async function ensureDailyWinner(posts = []) {
  const today = todayKey();

  const existing = await getTodayWinner();
  if (existing) return existing;

  const winner = pickLocalDailyWinner(posts);
  if (!winner?.id) return null;

  const { data: created, error } = await supabase
    .from("daily_winners")
    .insert({
      post_id: winner.id,
      user_id: winner.user_id || null,
      date: today,
    })
    .select("*, posts(*)")
    .single();

  if (error) {
    console.error("ensureDailyWinner insert error:", error);
    return {
      posts: winner,
      localOnly: true,
    };
  }

  await supabase
    .from("posts")
    .update({
      is_daily_winner: true,
      winner_date: today,
      boost_score: Number(winner.boost_score || 0) + 25,
    })
    .eq("id", winner.id);

  if (winner.user_id) {
    await addXP(winner.user_id, 100, "daily_winner");

    await supabase
      .from("profiles")
      .update({
        active_badge: "👑 Päivän voittaja",
      })
      .eq("id", winner.user_id);
  }

  return created;
}
