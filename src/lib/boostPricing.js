const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function calculateBoostPrice({
  currentBoosts = 0,
  basePrice = 1.5,
  rank = 10,
  timeLeftMs = ONE_DAY_MS,
  supportGap = null,
  demandMultiplier = 1,
} = {}) {
  const boosts = clamp(currentBoosts, 0, 40);
  let price = Number(basePrice || 1.5) * Math.pow(1.25, boosts);

  if (timeLeftMs <= TWO_HOURS_MS) price *= 1.5;
  else if (timeLeftMs <= 6 * 60 * 60 * 1000) price *= 1.18;

  if (rank === 2) price *= 1.3;
  else if (rank === 3) price *= 1.15;
  else if (rank <= 5) price *= 1.08;

  if (supportGap !== null && Number(supportGap) <= 85) price *= 1.12;

  price *= clamp(demandMultiplier, 0.8, 2.2);
  return roundMoney(clamp(price, 0.99, 49));
}

export function calculateBoostEffect({ amount = 1, currentBoostScore = 0, paidBoostCount = 0 } = {}) {
  const fatigue = Math.max(0.45, 1 - clamp(paidBoostCount, 0, 30) * 0.035);
  const diminishing = Math.log1p(Number(amount || 1)) * 8 * fatigue;
  return Math.round(Number(currentBoostScore || 0) + diminishing);
}

export function getBoostUrgency({ rank = 10, timeLeftMs = ONE_DAY_MS, supportGap = null } = {}) {
  if (timeLeftMs <= TWO_HOURS_MS) return "last_call";
  if (rank <= 3 && (supportGap === null || Number(supportGap) <= 120)) return "near_top";
  if (rank <= 5) return "rising";
  return "normal";
}

export function getBoostOffer(post = {}, context = {}) {
  const boosts = Number(post.paid_boost_count || post.boost_count || 0);
  const rank = Number(context.rank || post.rank || post.last_rank || 10);
  const timeLeftMs = Number(context.timeLeftMs || post.time_left_ms || ONE_DAY_MS);
  const supportGap = context.supportGap ?? post.support_gap ?? null;
  const demandMultiplier = Number(context.demandMultiplier || post.boost_demand_multiplier || 1);

  const price = calculateBoostPrice({ currentBoosts: boosts, rank, timeLeftMs, supportGap, demandMultiplier });
  const nextPrice = calculateBoostPrice({ currentBoosts: boosts + 1, rank, timeLeftMs, supportGap, demandMultiplier });
  const urgency = getBoostUrgency({ rank, timeLeftMs, supportGap });

  const labels = {
    last_call: "🔥 Viime hetket – boostaa näkyvyys",
    near_top: "🚀 Tämä voi nousta kärkeen",
    rising: "⚡ Nosta perustelu esiin",
    normal: boosts === 0 ? "🔥 Boostaa näkyvyys" : "🔥 Lisää boost",
  };

  return {
    price,
    nextPrice,
    urgency,
    label: labels[urgency],
    disclaimer: "Boost lisää näkyvyyttä, mutta ei takaa rahoitusta.",
  };
}
