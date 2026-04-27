import { supabase } from "./supabaseClient";

export const ACHIEVEMENTS = [
  {
    id: "first_post",
    title: "Ensimmäinen perustelu",
    icon: "✍️",
    description: "Luo ensimmäinen perustelusi.",
    points: 10,
  },
  {
    id: "first_vote",
    title: "Ensimmäinen ääni",
    icon: "💗",
    description: "Anna ensimmäinen äänesi.",
    points: 10,
  },
  {
    id: "three_posts",
    title: "Aktiivinen kirjoittaja",
    icon: "🔥",
    description: "Luo 3 perustelua.",
    points: 25,
  },
  {
    id: "top3",
    title: "TOP 3 -haastaja",
    icon: "🏆",
    description: "Nouse TOP 3 -sijoille.",
    points: 50,
  },
  {
    id: "viral",
    title: "Nousemassa",
    icon: "🚀",
    description: "Perustelusi saa vauhtia.",
    points: 30,
  },
];

export function getBadge(profile, posts = [], votes = []) {
  const postCount = posts.length;
  const voteCount = votes.length;
  const bestRank = Math.min(
    ...posts.map((p) => Number(p.best_rank || 999)).filter(Boolean),
    999
  );

  if (bestRank === 1) return "👑 Ykkönen";
  if (bestRank <= 3) return "🏆 TOP 3";
  if (postCount >= 10) return "🔥 Tekijä";
  if (postCount >= 3) return "✍️ Kirjoittaja";
  if (voteCount >= 10) return "💗 Tukija";
  return "🌱 Aloittaja";
}

export function getNextGoal(posts = [], votes = []) {
  if (posts.length === 0) return "Tee ensimmäinen perustelu";
  if (votes.length === 0) return "Anna ensimmäinen ääni";
  if (posts.length < 3) return `Tee vielä ${3 - posts.length} perustelua`;
  return "Nouse TOP 3 -sijoille";
}

export function calculateAchievements(profile, posts = [], votes = []) {
  const unlocked = [];
  const bestRank = Math.min(
    ...posts.map((p) => Number(p.best_rank || 999)).filter(Boolean),
    999
  );

  if (posts.length >= 1) unlocked.push("first_post");
  if (votes.length >= 1) unlocked.push("first_vote");
  if (posts.length >= 3) unlocked.push("three_posts");
  if (bestRank <= 3) unlocked.push("top3");

  if (
    posts.some(
      (p) =>
        Number(p.vote_count || p.votes || 0) >= 3 ||
        Number(p.viral_score || 0) >= 100
    )
  ) {
    unlocked.push("viral");
  }

  const achievements = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id));
  const score = achievements.reduce((sum, a) => sum + a.points, 0);

  return { achievements, score };
}

export async function syncAchievements(userId, profile, posts = [], votes = []) {
  if (!userId) return null;

  const { achievements, score } = calculateAchievements(profile, posts, votes);
  const activeBadge = getBadge(profile, posts, votes);
  const nextGoal = getNextGoal(posts, votes);

  const { data } = await supabase
    .from("profiles")
    .update({
      achievements,
      badges: achievements.map((a) => a.icon),
      active_badge: activeBadge,
      next_goal: nextGoal,
      achievement_score: score,
    })
    .eq("id", userId)
    .select("*")
    .single();

  return data;
}
