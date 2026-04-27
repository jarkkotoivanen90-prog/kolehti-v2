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

export function calculateGrowthScore(post, context = {}) {
  const weights = context.weights || DEFAULT_WEIGHTS;
  const votes = safeNumber(post.vote_count || post.votes, 0);
  const views = safeNumber(post.view_count || post.views, 0);
  const aiScore = safeNumber(post.ai_score, 50);
  const aiNeed = safeNumber(post.ai_need, 50);
  const aiClarity = safeNumber(post.ai_clarity, 50);
  const aiRisk = safeNumber(post.ai_risk, 0);
  const boost = safeNumber(post.boost_score, 0);
  const ageHours = hoursSince(post.created_at);
  const lastEngagedHours = hoursSince(post.last_engaged_at || post.created_at);

  const freshness = Math.max(0, 120 - ageHours * 4) * safeNumber(weights.freshness_weight, 1);
  const momentum = votes / Math.max(1, lastEngagedHours);
  const conversion = votes / Math.max(1, views);
  const quality = (aiScore * 1.5 + aiNeed * 1.2 + aiClarity) * safeNumber(weights.quality_weight, 1);
  const trustPenalty = Math.max(0, aiRisk * 3);
  const explorationBoost = context.voted?.[post.id] ? -90 : 30;
  const groupBoost = context.groupId && post.group_id === context.groupId ? 35 : 0;
  const ownerBoost = post.user_id === context.userId ? 15 : 0;
  const inviteBoost = safeNumber(context.profile?.referral_count, 0) >= 3 ? 20 * safeNumber(weights.invite_weight, 1) : 0;
  const voteSignal = votes * 95 * safeNumber(weights.vote_weight, 1);
  const impressionSignal = views * 2 * safeNumber(weights.impression_weight, 1);

  return Math.round(
    quality * 0.4 +
      voteSignal +
      impressionSignal +
      conversion * 180 +
      freshness * 0.4 +
      momentum * 140 +
      boost +
      explorationBoost +
      groupBoost +
      ownerBoost +
      inviteBoost -
      trustPenalty
  );
}

export function getGrowthReason(post, score, context = {}) {
  const votes = safeNumber(post.vote_count || post.votes, 0);
  const aiScore = safeNumber(post.ai_score, 50);

  if (post.user_id === context.userId && score > 250) return "Oma postaus nousussa";
  if (votes >= 10) return "Paljon ääniä";
  if (votes >= 3) return "Momentum käynnissä";
  if (aiScore >= 80) return "Vahva AI-arvio";
  if (context.groupId && post.group_id === context.groupId) return "Oman porukan sisältö";
  return "Uusi kasvumahdollisuus";
}

export function optimizeFeedForGrowth(posts = [], context = {}) {
  const enriched = posts.map((post) => {
    const growth_score = calculateGrowthScore(post, context);

    return {
      ...post,
      growth_score,
      growth_reason: getGrowthReason(post, growth_score, context),
    };
  });

  const highTrust = enriched.filter((post) => safeNumber(post.ai_risk, 0) <= 65);
  const risky = enriched.filter((post) => safeNumber(post.ai_risk, 0) > 65);

  const top = [...highTrust]
    .sort((a, b) => b.growth_score - a.growth_score)
    .slice(0, 18);

  const fresh = [...highTrust]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  const own = highTrust.filter((post) => post.user_id === context.userId).slice(0, 3);

  const merged = [...top, ...fresh, ...own];
  const unique = Array.from(new Map(merged.map((post) => [post.id, post])).values());

  return [...unique, ...risky.slice(0, 2)].sort((a, b) => b.growth_score - a.growth_score);
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
