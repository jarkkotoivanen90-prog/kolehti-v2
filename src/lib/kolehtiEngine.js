export const KOLEHTI_ENGINE_VERSION = "KOL-E2-2026-04-28";

export const ENGINE_RULES = {
  groupTargetSize: 1500,
  basePotEuro: 1000,
  activeUserPotEuro: 0.5,
  invitePotEuro: 1,
  underfilledThreshold: 1200,
  underfilledXpBoost: 1.2,
  weeklyFreePosts: 1,
  paidExtraPostEuro: 5,
  strongLikesPerDay: 10,
};

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

export function calculateLivePot({ activePlayers = 0, invitedPlayers = 0, basePot = ENGINE_RULES.basePotEuro } = {}) {
  const active = Math.max(0, Number(activePlayers || 0));
  const invited = Math.max(0, Number(invitedPlayers || 0));
  const amount = Math.round(basePot + active * ENGINE_RULES.activeUserPotEuro + invited * ENGINE_RULES.invitePotEuro);
  const fillRate = clamp((active / ENGINE_RULES.groupTargetSize) * 100, 0, 100);
  const isUnderfilled = active < ENGINE_RULES.underfilledThreshold;

  return {
    amount,
    fillRate,
    targetSize: ENGINE_RULES.groupTargetSize,
    activePlayers: active,
    missingPlayers: Math.max(0, ENGINE_RULES.groupTargetSize - active),
    isUnderfilled,
    xpMultiplier: isUnderfilled ? ENGINE_RULES.underfilledXpBoost : 1,
    message: isUnderfilled
      ? `Porukka vajaa: ${Math.max(0, ENGINE_RULES.groupTargetSize - active)} paikkaa jäljellä. Kutsu nostaa pottia.`
      : "Porukka täynnä. Nyt ratkaisee perustelujen laatu.",
  };
}

export function calculateInteractionXp({ action, strongLikesUsed = 0, groupSize = 0 } = {}) {
  const underfilledBoost = groupSize > 0 && groupSize < ENGINE_RULES.underfilledThreshold ? ENGINE_RULES.underfilledXpBoost : 1;
  const strongLikeAvailable = Number(strongLikesUsed || 0) < ENGINE_RULES.strongLikesPerDay;

  const base = {
    like: strongLikeAvailable ? 5 : 1,
    comment: 12,
    save: 15,
    boost: 20,
    invite: 50,
    post: 25,
    scroll_pass: 0,
    passive_decay: -1,
  }[action] ?? 0;

  return {
    xp: Math.round(base * underfilledBoost),
    strongLikeAvailable,
    strongLikesLeft: Math.max(0, ENGINE_RULES.strongLikesPerDay - Number(strongLikesUsed || 0)),
    multiplier: underfilledBoost,
  };
}

export function canCreateCompetitionPost({ postsThisWeek = 0, hasPaidExtra = false } = {}) {
  const count = Number(postsThisWeek || 0);
  if (count < ENGINE_RULES.weeklyFreePosts) {
    return { allowed: true, reason: "Viikkopostaus käytettävissä.", mode: "free" };
  }
  if (hasPaidExtra) {
    return { allowed: true, reason: "Lisäpostaus käytössä.", mode: "paid_extra" };
  }
  return {
    allowed: false,
    reason: `Viikkopostaus on käytetty. Lisäpostaus ${ENGINE_RULES.paidExtraPostEuro} € avaa uuden kilpailupostauksen.`,
    mode: "locked",
  };
}

export function calculatePostRankingScore(post = {}, context = {}) {
  const aiScore = clamp(post.ai_score || post.ai_quality || post.growth_score || 50);
  const votes = Math.max(0, Number(post.vote_count || post.votes || 0));
  const views = Math.max(1, Number(post.views || post.view_count || 1));
  const boost = clamp(post.boost_score || 0);
  const createdAt = post.created_at ? new Date(post.created_at).getTime() : Date.now();
  const ageHours = Math.max(0, (Date.now() - createdAt) / 36e5);
  const freshness = clamp(100 - ageHours * 3, 0, 100);
  const engagement = clamp((votes / views) * 100, 0, 100);
  const momentum = clamp(votes * 8 + boost * 0.6 - ageHours * 2, 0, 100);
  const socialProximity = clamp(context.sameGroup ? 80 : 35, 0, 100);

  const score =
    aiScore * 0.4 +
    momentum * 0.25 +
    engagement * 0.2 +
    freshness * 0.1 +
    socialProximity * 0.05;

  return Math.round(score * 100) / 100;
}

export function rankKolehtiFeed(posts = [], context = {}) {
  return [...(Array.isArray(posts) ? posts : [])]
    .filter(Boolean)
    .map((post) => ({
      ...post,
      kolehti_score: calculatePostRankingScore(post, context),
    }))
    .sort((a, b) => Number(b.kolehti_score || 0) - Number(a.kolehti_score || 0));
}

export function getPostTypeLabel({ postsThisWeek = 0, hasPaidExtra = false } = {}) {
  const result = canCreateCompetitionPost({ postsThisWeek, hasPaidExtra });
  if (result.mode === "free") return "Viikon kilpailupostaus";
  if (result.mode === "paid_extra") return "Maksettu lisäpostaus";
  return "Viikkoraja täynnä";
}

export function buildEngineSummary({ groupSize = 0, invitedPlayers = 0, postsThisWeek = 0, strongLikesUsed = 0 } = {}) {
  const pot = calculateLivePot({ activePlayers: groupSize, invitedPlayers });
  const likeXp = calculateInteractionXp({ action: "like", strongLikesUsed, groupSize });
  const postGate = canCreateCompetitionPost({ postsThisWeek });

  return {
    version: KOLEHTI_ENGINE_VERSION,
    pot,
    likeXp,
    postGate,
    rules: ENGINE_RULES,
  };
}
