export const KOLEHTI_GROUP_MAX = 1500;
export const KOLEHTI_DAILY_MAX_POT = 1000;
export const KOLEHTI_WEEKLY_MAX_POT = 3000;
export const KOLEHTI_MONTHLY_MAX_POT = 5000;

function isSameDay(dateLike, now = new Date()) {
  if (!dateLike) return false;
  const date = new Date(dateLike);
  return date.toDateString() === now.toDateString();
}

function getAuthorKey(post) {
  return post?.user_id || post?.author_id || post?.username || post?.display_name || post?.bot_name || post?.id || "unknown";
}

export function getPostVoteCount(post) {
  return Number(post?.votes || post?.vote_count || 0);
}

export function getPostAiScore(post) {
  return Number(post?.backend_score || post?.ai_score || post?.score || post?.winner_score || 0);
}

export function getReasonScore(post) {
  const votes = getPostVoteCount(post);
  const ai = getPostAiScore(post);
  return votes * 0.7 + ai * 0.3;
}

export function calculateKolehtiPhase1(posts = []) {
  const realPosts = posts.filter((post) => !post?.bot);
  const uniquePlayers = new Set(realPosts.map(getAuthorKey)).size;
  const estimatedGroupSize = Math.min(
    KOLEHTI_GROUP_MAX,
    Math.max(uniquePlayers, Number(realPosts[0]?.group_size || realPosts[0]?.member_count || 0), Math.ceil(uniquePlayers * 37))
  );

  const dailyPot = Math.min(KOLEHTI_DAILY_MAX_POT, estimatedGroupSize);
  const weeklyPot = Math.min(KOLEHTI_WEEKLY_MAX_POT, estimatedGroupSize * 7);
  const monthlyPot = Math.min(KOLEHTI_MONTHLY_MAX_POT, estimatedGroupSize * 30);
  const fillPercent = Math.round((estimatedGroupSize / KOLEHTI_GROUP_MAX) * 100);

  const todaysPosts = realPosts.filter((post) => isSameDay(post?.created_at));
  const pool = todaysPosts.length ? todaysPosts : realPosts;
  const dailyLeader = [...pool].sort((a, b) => getReasonScore(b) - getReasonScore(a))[0] || null;

  return {
    groupMax: KOLEHTI_GROUP_MAX,
    groupSize: estimatedGroupSize,
    fillPercent,
    missingPlayers: Math.max(0, KOLEHTI_GROUP_MAX - estimatedGroupSize),
    dailyPot,
    weeklyPot,
    monthlyPot,
    dailyLeader,
    dailyLeaderScore: dailyLeader ? Math.round(getReasonScore(dailyLeader)) : 0,
  };
}

export function formatEuro(value) {
  return `${Math.round(Number(value || 0)).toLocaleString("fi-FI")}€`;
}

export function getKolehtiReasonLabel(post) {
  if (post?.bot) return "AI nostaa keskustelun";
  if (post?.post_type === "reason" || post?.type === "reason") return "Perustelu";
  return "Perustelu";
}
