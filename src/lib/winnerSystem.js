export function getWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getNextWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + 8);
  return d;
}

export function formatTimeLeft(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days} pv ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

export function calculateWinnerScore(post = {}, potKey = "weekly") {
  const potBoost = potKey === "final" ? 1.35 : potKey === "monthly" ? 1.18 : potKey === "weekly" ? 1.08 : 1;
  const botBoost = post.bot ? 0.92 : 1;
  const weeklyBoost = post.weekly_entry || post.week_id ? 1.12 : 1;
  return Math.round((
    Number(post.votes || 0) * 12 +
    Number(post.ai_score || 0) +
    Number(post.growth_score || 0) * 0.55 +
    Number(post.boost_score || 0) * 4 +
    Number(post.watch_time_total || 0) * 2 +
    Number(post.shares || 0) * 6 +
    Number(post.near_win ? 18 : 0)
  ) * potBoost * botBoost * weeklyBoost);
}

export function buildWinnerRace(posts = [], { potKey = "weekly", amount = 0, weekId = getWeekId() } = {}) {
  const ranked = (posts || [])
    .filter((post) => post?.id && post?.content)
    .map((post) => ({ ...post, winner_score: calculateWinnerScore(post, potKey) }))
    .sort((a, b) => Number(b.winner_score || 0) - Number(a.winner_score || 0));

  const winner = ranked[0] || null;
  const runnerUp = ranked[1] || null;
  const gap = winner && runnerUp ? Math.max(1, Number(winner.winner_score || 0) - Number(runnerUp.winner_score || 0)) : 0;
  const isClose = Boolean(winner && runnerUp && gap <= 85);
  const lockedAt = getNextWeekStart();

  return {
    weekId,
    potKey,
    amount,
    winner,
    runnerUp,
    top3: ranked.slice(0, 3),
    ranked,
    gap,
    isClose,
    lockedAt,
    status: Date.now() >= lockedAt.getTime() ? "closed" : "live",
  };
}

export function getWinnerLabel(entry) {
  if (!entry) return "Ei vielä voittajaa";
  if (entry.bot) return `🤖 ${entry.bot_name || "Pelibotti"}`;
  return "Pelaaja";
}

export function getWinnerReason(race) {
  if (!race?.winner) return "Odottamassa viikon osallistumisia.";
  if (race.isClose && race.runnerUp) return `${getWinnerLabel(race.runnerUp)} on vain ${race.gap} pisteen päässä.`;
  return `${getWinnerLabel(race.winner)} johtaa viikon pottia.`;
}
