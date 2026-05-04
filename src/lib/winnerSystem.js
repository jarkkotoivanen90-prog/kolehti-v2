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

export const POT_ENTITLEMENTS = {
  day: ["daily", "subscription", "founder", "admin"],
  daily: ["daily", "subscription", "founder", "admin"],
  weekly: ["subscription", "founder", "admin"],
  week: ["subscription", "founder", "admin"],
  monthly: ["subscription", "founder", "admin"],
  month: ["subscription", "founder", "admin"],
  final: ["subscription", "founder", "admin"],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function getPotMultiplier(potKey = "weekly") {
  if (potKey === "final") return 1.35;
  if (potKey === "monthly" || potKey === "month") return 1.18;
  if (potKey === "weekly" || potKey === "week") return 1.08;
  return 1;
}

function getUserKey(post = {}) {
  return post.user_id || post.author_id || post.profile_id || post.id;
}

function getActiveEntitlements(post = {}) {
  const raw = post.entitlements || post.active_entitlements || post.user_entitlements || post.eligibilities || [];
  if (Array.isArray(raw)) return raw.map((item) => typeof item === "string" ? item : item?.type).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

export function hasPotEligibility(post = {}, potKey = "weekly") {
  if (post.bot) return Boolean(post.bot_eligible);
  if (post.is_admin_entry || post.admin_eligible) return true;

  const required = POT_ENTITLEMENTS[potKey] || POT_ENTITLEMENTS.weekly;
  const entitlements = getActiveEntitlements(post);

  if (post.has_subscription || post.subscription_active) entitlements.push("subscription");
  if (post.has_daily_entry || post.daily_entry_active) entitlements.push("daily");
  if (post.founder_eligible) entitlements.push("founder");

  return entitlements.some((type) => required.includes(type));
}

export function calculateTrustMultiplier(post = {}) {
  const trustScore = clamp(post.trust_score ?? post.retention_score ?? 70, 0, 100);
  const accountAgeDays = clamp(post.account_age_days ?? post.profile_age_days ?? 14, 0, 365);
  const reports = clamp(post.report_count ?? post.reports ?? 0, 0, 20);
  const suspiciousVotes = clamp(post.suspicious_vote_ratio ?? post.vote_risk ?? 0, 0, 1);
  const verifiedBonus = post.verified_profile || post.email_verified ? 0.04 : 0;

  const trustPart = 0.72 + (trustScore / 100) * 0.36;
  const agePart = accountAgeDays < 2 ? 0.82 : accountAgeDays < 7 ? 0.92 : 1;
  const reportPenalty = Math.max(0.78, 1 - reports * 0.025);
  const votePenalty = Math.max(0.7, 1 - suspiciousVotes * 0.35);

  return clamp((trustPart + verifiedBonus) * agePart * reportPenalty * votePenalty, 0.58, 1.16);
}

export function calculateFairnessMultiplier(post = {}) {
  const recentWins = clamp(post.recent_win_count ?? post.wins_last_30d ?? 0, 0, 10);
  const firstPlaceCount = clamp(post.first_place_count ?? 0, 0, 50);
  const top3Count = clamp(post.top3_count ?? 0, 0, 100);
  const lossStreak = clamp(post.loss_streak ?? post.near_win_streak ?? 0, 0, 10);

  const recentWinPenalty = Math.pow(0.78, recentWins);
  const dominancePenalty = Math.max(0.72, 1 - firstPlaceCount * 0.015 - top3Count * 0.004);
  const comebackBoost = 1 + Math.min(0.16, lossStreak * 0.025);

  return clamp(recentWinPenalty * dominancePenalty * comebackBoost, 0.42, 1.16);
}

export function calculateBoostMultiplier(post = {}, potKey = "weekly") {
  const rawBoost = clamp(post.boost_score || 0, 0, 1000);
  const paidBoostCount = clamp(post.paid_boost_count || post.boost_count || 0, 0, 20);
  const boostCap = potKey === "final" ? 0.16 : potKey === "monthly" || potKey === "month" ? 0.20 : 0.24;
  const diminishingBoost = Math.log1p(rawBoost) / Math.log(101);
  const fatiguePenalty = Math.max(0.68, 1 - paidBoostCount * 0.035);
  const boostLift = Math.min(boostCap, diminishingBoost * boostCap) * fatiguePenalty;
  return clamp(1 + boostLift, 1, 1 + boostCap);
}

export function calculateBaseWinnerScore(post = {}) {
  const votes = clamp(post.votes || post.vote_count || 0, -200, 10000);
  const positiveVotes = Math.max(0, votes);
  const aiScore = clamp(post.backend_score ?? post.ai_score ?? post.score ?? 50, 0, 100);
  const growthScore = clamp(post.growth_score || 0, 0, 1000);
  const watchTime = clamp(post.watch_time_total || 0, 0, 5000);
  const shares = clamp(post.shares || post.share_count || 0, 0, 1000);
  const nearWin = post.near_win ? 18 : 0;

  return (
    positiveVotes * 12 +
    aiScore * 1.05 +
    growthScore * 0.42 +
    Math.sqrt(watchTime) * 4.5 +
    shares * 5.5 +
    nearWin
  );
}

export function calculateWinnerScore(post = {}, potKey = "weekly", options = {}) {
  const eligibilityRequired = options.eligibilityRequired !== false;
  const eligible = !eligibilityRequired || hasPotEligibility(post, potKey);
  const baseScore = calculateBaseWinnerScore(post);
  const potMultiplier = getPotMultiplier(potKey);
  const botMultiplier = post.bot ? 0.72 : 1;
  const weeklyMultiplier = post.weekly_entry || post.week_id ? 1.08 : 1;
  const trustMultiplier = calculateTrustMultiplier(post);
  const fairnessMultiplier = calculateFairnessMultiplier(post);
  const boostMultiplier = calculateBoostMultiplier(post, potKey);
  const eligibilityMultiplier = eligible ? 1 : 0;

  const winnerScore = Math.round(
    baseScore *
    potMultiplier *
    botMultiplier *
    weeklyMultiplier *
    trustMultiplier *
    fairnessMultiplier *
    boostMultiplier *
    eligibilityMultiplier
  );

  return winnerScore;
}

export function explainWinnerScore(post = {}, potKey = "weekly", options = {}) {
  const eligible = options.eligibilityRequired === false || hasPotEligibility(post, potKey);
  return {
    eligible,
    base_score: Math.round(calculateBaseWinnerScore(post)),
    pot_multiplier: Number(getPotMultiplier(potKey).toFixed(3)),
    trust_multiplier: Number(calculateTrustMultiplier(post).toFixed(3)),
    fairness_multiplier: Number(calculateFairnessMultiplier(post).toFixed(3)),
    boost_multiplier: Number(calculateBoostMultiplier(post, potKey).toFixed(3)),
    final_score: calculateWinnerScore(post, potKey, options),
  };
}

export function buildWinnerRace(posts = [], { potKey = "weekly", amount = 0, weekId = getWeekId(), eligibilityRequired = true } = {}) {
  const scored = (posts || [])
    .filter((post) => post?.id && post?.content)
    .map((post) => ({
      ...post,
      winner_breakdown: explainWinnerScore(post, potKey, { eligibilityRequired }),
      winner_score: calculateWinnerScore(post, potKey, { eligibilityRequired }),
    }));

  const ranked = scored
    .filter((post) => !eligibilityRequired || post.winner_breakdown?.eligible)
    .sort((a, b) => Number(b.winner_score || 0) - Number(a.winner_score || 0));

  const ineligible = scored.filter((post) => eligibilityRequired && !post.winner_breakdown?.eligible);
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
    ineligible,
    gap,
    isClose,
    lockedAt,
    status: Date.now() >= lockedAt.getTime() ? "closed" : "live",
  };
}

export function getWinnerLabel(entry) {
  if (!entry) return "Ei vielä voittajaa";
  if (entry.bot) return `🤖 ${entry.bot_name || "Pelibotti"}`;
  return entry.identity?.alias || entry.display_name || entry.username || "Pelaaja";
}

export function getWinnerReason(race) {
  if (!race?.winner) return "Odottamassa kelpoisia osallistumisia.";
  if (race.isClose && race.runnerUp) return `${getWinnerLabel(race.runnerUp)} on vain ${race.gap} pisteen päässä.`;
  return `${getWinnerLabel(race.winner)} johtaa pottia luottamus-, aktiivisuus- ja fairness-pisteillä.`;
}
