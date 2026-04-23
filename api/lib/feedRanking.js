function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function freshnessScore(createdAt) {
  const h = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (h < 1) return 1;
  if (h < 6) return 0.9;
  if (h < 24) return 0.75;
  if (h < 48) return 0.55;
  return 0.35;
}
function engagementScore(votes = 0) { return clamp(Math.log10(Number(votes || 0) + 1) / 2); }
function visibilityScore(post) { return clamp(0.5 + Number(post.visibility_score || 1) * 0.1 + Number(post.boost_visibility || 0) * 0.4); }
function profileTrustScore(profile) { return clamp(Number(profile?.reputation_score || 0.5)); }

export function computeFeedScore(post, profile, weights = {}) {
  const w = { ai: 0.32, quality: 0.18, engagement: 0.20, freshness: 0.15, trust: 0.10, visibility: 0.05, ...weights };
  const ai = clamp(Number(post.ai_score || 0.5));
  const quality = clamp(Number(post.quality_score || 0.5));
  const fresh = freshnessScore(post.created_at);
  const engage = engagementScore(post.votes);
  const trust = profileTrustScore(profile);
  const visible = visibilityScore(post);
  return Number((w.ai*ai + w.quality*quality + w.engagement*engage + w.freshness*fresh + w.trust*trust + w.visibility*visible).toFixed(4));
}
export function explainFeedScore(post, profile) {
  const reasons = [];
  if (Number(post.ai_score || 0) >= 0.8) reasons.push("vahva AI-arvio");
  if (Number(post.quality_score || 0) >= 0.75) reasons.push("hyvä laatu");
  if (Number(post.votes || 0) >= 5) reasons.push("hyvä yhteisöreaktio");
  if (Number(profile?.reputation_score || 0.5) >= 0.7) reasons.push("luotettava kirjoittaja");
  if (Number(post.boost_visibility || 0) > 0) reasons.push("korostettu näkyvyys");
  return reasons.slice(0,3).join(", ") || "tasapainoinen kokonaisuus";
}
