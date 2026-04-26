import { supabase } from "./supabaseClient";

export function calculateRankInfo(posts = [], postId) {
  const index = posts.findIndex((p) => p.id === postId);
  if (index === -1) return null;

  const rank = index + 1;
  const topThreeVotes = posts[2]?.vote_count || posts[2]?.votes || 0;
  const currentVotes = posts[index]?.vote_count || posts[index]?.votes || 0;

  return {
    rank,
    votesNeededForTop3: Math.max(0, topThreeVotes + 1 - currentVotes),
    isTop3: rank <= 3,
    isAlmostWin: rank > 3 && rank <= 8,
  };
}

export function getAlmostWinText(rankInfo) {
  if (!rankInfo) return "";

  if (rankInfo.isTop3) {
    return "🏆 Olet TOP 3:ssa!";
  }

  if (rankInfo.votesNeededForTop3 <= 1) {
    return "⚡ 1 ääni TOP 3:een!";
  }

  return `🔥 ${rankInfo.votesNeededForTop3} ääntä TOP 3:een`;
}

export async function updatePostRankStats(post, rank) {
  if (!post?.id || !rank) return;

  const bestRank = post.best_rank
    ? Math.min(Number(post.best_rank), rank)
    : rank;

  await supabase
    .from("posts")
    .update({
      last_rank: rank,
      best_rank: bestRank,
    })
    .eq("id", post.id);
}

export async function notifyAlmostWin({ post, rankInfo, userId }) {
  if (!post?.user_id) return;
  if (!rankInfo?.isAlmostWin) return;
  if (post.almost_win_notified) return;

  await supabase.from("notifications").insert({
    user_id: post.user_id,
    type: "almost_win",
    title: "🔥 Perustelusi on lähellä TOP 3:a",
    body: getAlmostWinText(rankInfo),
    meta: {
      post_id: post.id,
      rank: rankInfo.rank,
      votes_needed: rankInfo.votesNeededForTop3,
      triggered_by: userId || null,
    },
  });

  await supabase
    .from("posts")
    .update({
      almost_win_notified: true,
    })
    .eq("id", post.id);
}
