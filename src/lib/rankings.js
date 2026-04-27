import { supabase } from "./supabaseClient";

export async function getUserRanking(limit = 30) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, active_badge, xp, level, growth_score, referral_count, total_posts_created, total_votes_given")
    .order("xp", { ascending: false })
    .order("growth_score", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getGroupRanking(limit = 30) {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, member_count, total_points, active")
    .eq("active", true)
    .order("total_points", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getPostRanking(limit = 30) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, content, user_id, group_id, votes, ai_score, boost_score, created_at, hidden")
    .eq("hidden", false)
    .order("votes", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
