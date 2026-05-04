export function calculateBoostPrice({ currentBoosts = 0, basePrice = 1.5 }) {
  const growthFactor = 1.25;
  const dynamic = basePrice * Math.pow(growthFactor, currentBoosts);
  return Math.round(dynamic * 100) / 100;
}

export function calculateBoostEffect({ amount = 1, currentBoostScore = 0 }) {
  const diminishing = Math.log1p(amount) * 8;
  return Math.round(currentBoostScore + diminishing);
}

export function getBoostOffer(post = {}) {
  const boosts = post.paid_boost_count || 0;
  const price = calculateBoostPrice({ currentBoosts: boosts });

  return {
    price,
    nextPrice: calculateBoostPrice({ currentBoosts: boosts + 1 }),
    label: boosts === 0 ? "🔥 Boostaa näkyvyys" : "🔥 Lisää boost",
  };
}
