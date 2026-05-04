function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

export function calculateTrustScore(user = {}) {
  let score = 1.0;

  const age = clamp(user.account_age_days, 0, 365);
  if (age < 2) score *= 0.7;
  else if (age < 7) score *= 0.85;

  const devices = clamp(user.device_count, 0, 20);
  if (devices > 3) score *= 0.6;

  if (user.vote_spike_detected) score *= 0.5;

  const reports = clamp(user.reports, 0, 20);
  if (reports > 3) score *= 0.7;

  return clamp(score, 0.3, 1.2);
}

export function detectVoteManipulation(votes = []) {
  const grouped = {};

  votes.forEach(v => {
    const key = v.ip || v.device_id || "unknown";
    grouped[key] = (grouped[key] || 0) + 1;
  });

  return Object.values(grouped).some(count => count > 5);
}

export function applyShadowban(post = {}) {
  if (post.flagged || post.suspicious || post.trust_score < 0.5) {
    return 0.2;
  }
  return 1;
}
