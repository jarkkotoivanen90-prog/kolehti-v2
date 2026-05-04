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

export const FUNDING_ACCESS = {
  day: ["daily", "support_credits", "subscription", "founder", "admin"],
  daily: ["daily", "support_credits", "subscription", "founder", "admin"],
  weekly: ["subscription", "founder", "admin"],
  week: ["subscription", "founder", "admin"],
  monthly: ["subscription", "founder", "admin"],
  month: ["subscription", "founder", "admin"],
  final: ["subscription", "founder", "admin"],
};

export const POT_ENTITLEMENTS = FUNDING_ACCESS;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function getRoundMultiplier(roundKey = "weekly") {
  if (roundKey === "final") return 1.18;
  if (roundKey === "monthly" || roundKey === "month") return 1.1;
  if (roundKey === "weekly" || roundKey === "week") return 1.05;
  return 1;
}

function getActiveAccess(post = {}) {
  const raw = post.entitlements || post.active_entitlements || post.user_entitlements || post.eligibilities || post.access || [];
  if (Array.isArray(raw)) return raw.map((item) => typeof item === "string" ? item : item?.type).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

export function hasFundingAccess(post = {}, roundKey = "weekly") {
  if (post.bot) return Boolean(post.bot_eligible);
  if (post.is_admin_entry || post.admin_eligible) return true;

  const required = FUNDING_ACCESS[roundKey] || FUNDING_ACCESS.weekly;
  const access = getActiveAccess(post);

  if (post.has_subscription || post.subscription_active) access.push("subscription");
  if (post.has_daily_entry || post.daily_entry_active) access.push("daily");
  if (post.has_support_credits || post.support_credits_active) access.push("support_credits");
  if (post.founder_eligible) access.push("founder");

  return access.some((type) => required.includes(type));
}

export const hasPotEligibility = hasFundingAccess;

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
  const recentFunding = clamp(post.recent_funding_count ?? post.recent_win_count ?? post.wins_last_30d ?? 0, 0, 10);
  const fundedCount = clamp(post.funded_count ?? post.first_place_count ?? 0, 0, 50);
  const topSupportedCount = clamp(post.top_supported_count ?? post.top3_count ?? 0, 0, 100);
  const nearSupportStreak = clamp(post.near_support_streak ?? post.loss_streak ?? post.near_win_streak ?? 0, 0, 10);

  const recentFundingPenalty = Math.pow(0.82, recentFunding);
  const dominancePenalty = Math.max(0.74, 1 - fundedCount * 0.012 - topSupportedCount * 0.003);
  const comebackBoost = 1 + Math.min(0.14, nearSupportStreak * 0.022);

  return clamp(recentFundingPenalty * dominancePenalty * comebackBoost, 0.48, 1.14);
}

export function calculateVisibilityMultiplier(post = {}, roundKey = "weekly") {
  const rawBoost = clamp(post.boost_score || 0, 0, 1000);
  const paidBoostCount = clamp(post.paid_boost_count || post.boost_count || 0, 0, 20);
  const visibilityCap = roundKey === "final" ? 0.06 : roundKey === "monthly" || roundKey === "month" ? 0.08 : 0.1;
  const diminishingBoost = Math.log1p(rawBoost) / Math.log(101);
  const fatiguePenalty = Math.max(0.72, 1 - paidBoostCount * 0.04);
  const lift = Math.min(visibilityCap, diminishingBoost * visibilityCap) * fatiguePenalty;
  return clamp(1 + lift, 1, 1 + visibilityCap);
}

export const calculateBoostMultiplier = calculateVisibilityMultiplier;

export function calculateBaseSupportScore(post = {}) {
  const votes = clamp(post.votes || post.vote_count || 0, -200, 10000);
  const positiveVotes = Math.max(0, votes);
  const directSupport = clamp(post.support_amount || post.direct_support_cents / 100 || 0, 0, 100000);
  const supportCredits = clamp(post.support_credits_received || post.credit_support || 0, 0, 10000);
  const aiScore = clamp(post.backend_score ?? post.ai_score ?? post.score ?? 50, 0, 100);
  const engagement = clamp(post.watch_time_total || 0, 0, 5000);
  const shares = clamp(post.shares || post.share_count || 0, 0, 1000);
  const nearSupport = post.near_support || post.near_win ? 14 : 0;

  return (
    positiveVotes * 10 +
    directSupport * 9 +
    supportCredits * 4 +
    aiScore * 0.9 +
    Math.sqrt(engagement) * 3.8 +
    shares * 4.5 +
    nearSupport
  );
}

export const calculateBaseWinnerScore = calculateBaseSupportScore;

export function calculateSupportScore(post = {}, roundKey = "weekly", options = {}) {
  const accessRequired = options.eligibilityRequired !== false && options.accessRequired !== false;
  const eligible = !accessRequired || hasFundingAccess(post, roundKey);
  const baseScore = calculateBaseSupportScore(post);
  const roundMultiplier = getRoundMultiplier(roundKey);
  const botMultiplier = post.bot ? 0.7 : 1;
  const trustMultiplier = calculateTrustMultiplier(post);
  const fairnessMultiplier = calculateFairnessMultiplier(post);
  const visibilityMultiplier = calculateVisibilityMultiplier(post, roundKey);
  const accessMultiplier = eligible ? 1 : 0;

  return Math.round(
    baseScore *
    roundMultiplier *
    botMultiplier *
    trustMultiplier *
    fairnessMultiplier *
    visibilityMultiplier *
    accessMultiplier
  );
}

export const calculateWinnerScore = calculateSupportScore;

export function explainSupportScore(post = {}, roundKey = "weekly", options = {}) {
  const eligible = options.eligibilityRequired === false || options.accessRequired === false || hasFundingAccess(post, roundKey);
  return {
    eligible,
    base_support_score: Math.round(calculateBaseSupportScore(post)),
    round_multiplier: Number(getRoundMultiplier(roundKey).toFixed(3)),
    trust_multiplier: Number(calculateTrustMultiplier(post).toFixed(3)),
    fairness_multiplier: Number(calculateFairnessMultiplier(post).toFixed(3)),
    visibility_multiplier: Number(calculateVisibilityMultiplier(post, roundKey).toFixed(3)),
    final_support_score: calculateSupportScore(post, roundKey, options),
  };
}

export const explainWinnerScore = explainSupportScore;

export function buildFundingRound(posts = [], { potKey = "weekly", roundKey = potKey, amount = 0, weekId = getWeekId(), eligibilityRequired = true, accessRequired = eligibilityRequired } = {}) {
  const scored = (posts || [])
    .filter((post) => post?.id && post?.content)
    .map((post) => {
      const breakdown = explainSupportScore(post, roundKey, { accessRequired });
      const supportScore = calculateSupportScore(post, roundKey, { accessRequired });
      return {
        ...post,
        support_breakdown: breakdown,
        winner_breakdown: breakdown,
        support_score: supportScore,
        winner_score: supportScore,
      };
    });

  const ranked = scored
    .filter((post) => !accessRequired || post.support_breakdown?.eligible)
    .sort((a, b) => Number(b.support_score || 0) - Number(a.support_score || 0));

  const ineligible = scored.filter((post) => accessRequired && !post.support_breakdown?.eligible);
  const topSupported = ranked[0] || null;
  const runnerUp = ranked[1] || null;
  const gap = topSupported && runnerUp ? Math.max(1, Number(topSupported.support_score || 0) - Number(runnerUp.support_score || 0)) : 0;
  const isClose = Boolean(topSupported && runnerUp && gap <= 85);
  const lockedAt = getNextWeekStart();

  return {
    weekId,
    potKey: roundKey,
    roundKey,
    amount,
    topSupported,
    winner: topSupported,
    runnerUp,
    top3: ranked.slice(0, 3),
    ranked,
    ineligible,
    gap,
    isClose,
    lockedAt,
    status: Date.now() >= lockedAt.getTime() ? "closed" : "live",
    legalMode: "hybrid_community_funding",
  };
}

export const buildWinnerRace = buildFundingRound;

export function getWinnerLabel(entry) {
  if (!entry) return "Ei vielä tuettavaa";
  if (entry.bot) return `🤖 ${entry.bot_name || "Pelibotti"}`;
  return entry.identity?.alias || entry.display_name || entry.username || "Pelaaja";
}

export function getWinnerReason(round) {
  if (!round?.winner) return "Odotetaan yhteisön tukisignaaleja.";
  if (round.isClose && round.runnerUp) return `${getWinnerLabel(round.runnerUp)} on vain ${round.gap} tukipisteen päässä.`;
  return `${getWinnerLabel(round.winner)} on kierroksen eniten tuettu perustelu.`;
}
