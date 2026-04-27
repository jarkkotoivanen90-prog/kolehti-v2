import { supabase } from "./supabaseClient";

const DEFAULT_WEIGHTS = {
  vote_weight: 1,
  invite_weight: 1,
  impression_weight: 1,
  notification_weight: 1,
  freshness_weight: 1,
  quality_weight: 1,
};

function hoursSince(dateValue) {
  if (!dateValue) return 24;
  return Math.max(1, (Date.now() - new Date(dateValue).getTime()) / 1000 / 60 / 60);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export async function getOptimizerWeights() {
  const { data, error } = await supabase
    .from("optimizer_weights")
    .select("key,value");

  if (error || !data?.length) return DEFAULT_WEIGHTS;

  return data.reduce(
    (weights, row) => ({
      ...weights,
      [row.key]: safeNumber(row.value, DEFAULT_WEIGHTS[row.key] || 1),
    }),
    { ...DEFAULT_WEIGHTS }
  );
}

export function getLearningBoost(post = {}) {
  const votes = safeNumber(post.vote_count || post.votes, 0);
  const views = safeNumber(post.view_count || post.views, 0);
  const boost = safeNumber(post.boost_score, 0);
  const engagementRate = votes / Math.max(1, views);

  if (boost >= 250) return 1.35;
  if (engagementRate > 0.3 && votes >= 5) return 1.4;
  if (engagementRate > 0.15 && votes >= 3) return 1.2;
  if (engagementRate > 0.05 || votes >= 2) return 1.1;
  return 1;
}

export function calculateAISignal(post) {
  const aiScore = safeNumber(post.ai_score, 50);
  const aiQuality = safeNumber(post.ai_quality, aiScore);
  const aiNeed = safeNumber(post.ai_need, 50);
  const aiClarity = safeNumber(post.ai_clarity, 50);
  const aiRisk = safeNumber(post.ai_risk, 0);

  const highNeedBonus = aiNeed >= 80 ? 45 : aiNeed >= 65 ? 22 : 0;
  const qualityBonus = aiQuality >= 85 ? 55 : aiQuality >= 72 ? 28 : 0;
  const clarityBonus = aiClarity >= 80 ? 25 : aiClarity >= 65 ? 12 : 0;
  const weakPenalty = aiQuality < 35 || aiClarity < 35 ? 45 : 0;
  const riskPenalty = aiRisk >= 75 ? 180 : aiRisk >= 55 ? 90 : aiRisk * 1.8;

  const aiSignal =
    aiScore * 1.1 +
    aiQuality * 1.35 +
    aiNeed * 1.15 +
    aiClarity * 0.9 +
    highNeedBonus +
    qualityBonus +
    clarityBonus -
    weakPenalty -
    riskPenalty;

  return Math.round(clamp(aiSignal, -120, 360));
}

export function calculateGrowthScore(post, context = {}) {
  const weights = context.weights || DEFAULT_WEIGHTS;
  const votes = safeNumber(post.vote_count || post.votes, 0);
  const views = safeNumber(post.view_count || post.views, 0);
  const boost = safeNumber(post.boost_score, 0);
  const ageHours = hoursSince(post.created_at);
  const lastEngagedHours = hoursSince(post.last_engaged_at || post.created_at);
  const aiRisk = safeNumber(post.ai_risk, 0);

  const aiSignal = calculateAISignal(post) * safeNumber(weights.quality_weight, 1);
  const freshness = Math.max(0, 140 - ageHours * 4.5) * safeNumber(weights.freshness_weight, 1);
  const momentum = votes / Math.max(1, lastEngagedHours);
  const conversion = votes / Math.max(1, views);
  const explorationBoost = context.voted?.[post.id] ? -110 : 35;
  const groupBoost = context.groupId && post.group_id === context.groupId ? 35 : 0;
  const ownerBoost = post.user_id === context.userId ? 10 : 0;
  const inviteBoost = safeNumber(context.profile?.referral_count, 0) >= 3 ? 20 * safeNumber(weights.invite_weight, 1) : 0;
  const voteSignal = votes * 88 * safeNumber(weights.vote_weight, 1);
  const impressionSignal = Math.min(120, views * 1.5) * safeNumber(weights.impression_weight, 1);
  const riskGatePenalty = aiRisk >= 70 ? 250 : aiRisk >= 50 ? 100 : 0;

  const baseScore =
    aiSignal +
    voteSignal +
    impressionSignal +
    conversion * 170 +
    freshness * 0.42 +
    momentum * 150 +
    boost +
    explorationBoost +
    groupBoost +
    ownerBoost +
    inviteBoost -
    riskGatePenalty;

  return Math.round(baseScore * getLearningBoost(post));
}

export function getGrowthReason(post, score, context = {}) {
  const votes = safeNumber(post.vote_count || post.votes, 0);
  const aiScore = safeNumber(post.ai_score, 50);
  const aiQuality = safeNumber(post.ai_quality, aiScore);
  const aiNeed = safeNumber(post.ai_need, 50);
  const aiRisk = safeNumber(post.ai_risk, 0);
  const learningBoost = getLearningBoost(post);

  if (aiRisk >= 70) return "Tarkistetaan turvallisuutta";
  if (learningBoost >= 1.3) return "Trendaa nopeasti";
  if (post.user_id === context.userId && score > 260) return "Oma postaus nousussa";
  if (votes >= 10) return "Paljon ääniä";
  if (votes >= 3) return "Momentum käynnissä";
  if (aiNeed >= 82) return "Korkea tarvesignaali";
  if (aiQuality >= 82) return "Vahva perustelu";
  if (aiScore >= 80) return "Vahva AI-arvio";
  if (context.groupId && post.group_id === context.groupId) return "Oman porukan sisältö";
  return "Uusi kasvumahdollisuus";
}

export function optimizeFeedForGrowth(posts = [], context = {}) {
  const enriched = posts.map((post) => {
    const growth_score = calculateGrowthScore(post, context);
    const ai_signal = calculateAISignal(post);
    const learning_boost = getLearningBoost(post);

    return {
      ...post,
      growth_score,
      ai_signal,
      learning_boost,
      growth_reason: getGrowthReason(post, growth_score, context),
    };
  });

  const safe = enriched.filter((post) => safeNumber(post.ai_risk, 0) < 70);
  const risky = enriched.filter((post) => safeNumber(post.ai_risk, 0) >= 70);

  const top = [...safe]
    .sort((a, b) => b.growth_score - a.growth_score)
    .slice(0, 20);

  const highNeed = [...safe]
    .filter((post) => safeNumber(post.ai_need, 0) >= 75)
    .sort((a, b) => b.ai_signal - a.ai_signal)
    .slice(0, 5);

  const trending = [...safe]
    .filter((post) => safeNumber(post.learning_boost, 1) > 1)
    .sort((a, b) => b.learning_boost - a.learning_boost)
    .slice(0, 5);

  const fresh = [...safe]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const own = safe.filter((post) => post.user_id === context.userId).slice(0, 2);

  const merged = [...top, ...trending, ...highNeed, ...fresh, ...own];
  const unique = Array.from(new Map(merged.map((post) => [post.id, post])).values());

  return [...unique, ...risky.slice(0, 1)].sort((a, b) => b.growth_score - a.growth_score);
}

export async function optimizeFeedForGrowthAsync(posts = [], context = {}) {
  const weights = await getOptimizerWeights();
  return optimizeFeedForGrowth(posts, { ...context, weights });
}

export async function trackGrowthImpression({ userId, postId, reason, score }) {
  if (!postId) return;

  await supabase.from("growth_events").insert({
    user_id: userId || null,
    event_type: "growth_impression",
    source: "ai_growth_optimizer",
    points: 1,
    meta: {
      post_id: postId,
      reason,
      score,
    },
  });
}

export async function trackTopGrowthImpressions(userId, posts = []) {
  const top = posts.slice(0, 5);

  await Promise.all(
    top.map((post) =>
      trackGrowthImpression({
        userId,
        postId: post.id,
        reason: post.growth_reason,
        score: post.growth_score,
      })
    )
  );
}
