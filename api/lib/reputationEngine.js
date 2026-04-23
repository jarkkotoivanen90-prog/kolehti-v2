function clamp(value, min = 0.05, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function getTrustLevel(score = 0.5) {
  if (score >= 0.85) return "elite";
  if (score >= 0.7) return "high";
  if (score >= 0.55) return "medium";
  return "new";
}

export function voteWeightFromReputation(score = 0.5) {
  return Number((0.8 + score * 0.4).toFixed(3));
}

export function visibilityBonusFromReputation(score = 0.5) {
  return Number((score * 0.15).toFixed(3));
}

export function boostMultiplierFromReputation(score = 0.5) {
  return Number((0.9 + score * 0.2).toFixed(3));
}

export function postDelta({ moderationStatus = "approved", aiScore = 0.5, duplicate = false }) {
  let delta = 0;
  if (moderationStatus === "approved") delta += 0.015;
  if (moderationStatus === "review") delta -= 0.01;
  if (moderationStatus === "rejected") delta -= 0.08;
  if (aiScore >= 0.8) delta += 0.015;
  else if (aiScore < 0.4) delta -= 0.015;
  if (duplicate) delta -= 0.05;
  return Number(delta.toFixed(3));
}

export function voteDelta({ suspicious = false, duplicateVote = false }) {
  let delta = 0.01;
  if (suspicious) delta -= 0.06;
  if (duplicateVote) delta -= 0.04;
  return Number(delta.toFixed(3));
}

export function applyDelta(current = 0.5, delta = 0) {
  return Number(clamp(current + delta).toFixed(3));
}
