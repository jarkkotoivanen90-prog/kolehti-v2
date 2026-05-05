import { supabase } from "./supabaseClient";

export async function getLeaderboard() {
  const { data } = await supabase
    .from("leaderboard")
    .select("user_id,user_name,xp,level,streak_count,prev_rank,period")
    .order("xp", { ascending: false });

  return data || [];
}

export async function getMyRankWithNeighbors() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) return null;

  const list = await getLeaderboard();
  const index = list.findIndex((u) => u.user_id === user.id);

  if (index < 0) return null;

  return {
    rank: index + 1,
    me: list[index],
    above: list[index - 1] || null,
    below: list[index + 1] || null,
  };
}
