function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function textAffinity(text = "", preferences = {}) {
  const lower = String(text).toLowerCase();
  const likedKeywords = preferences.keywords || [];
  const dislikedKeywords = preferences.disliked_keywords || [];
  let score = 0.5;
  for (const word of likedKeywords) if (lower.includes(String(word).toLowerCase())) score += 0.08;
  for (const word of dislikedKeywords) if (lower.includes(String(word).toLowerCase())) score -= 0.08;
  return clamp(score);
}
function trustAffinity(post, preferences = {}) {
  const trustBias = preferences.prefer_trusted_profiles ? 0.08 : 0;
  const rep = Number(post?.profile?.reputation_score || 0.5);
  return clamp(0.5 + rep * 0.25 + trustBias);
}
function freshnessBias(createdAt) {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000*60*60);
  if (ageHours < 1) return 1;
  if (ageHours < 6) return 0.88;
  if (ageHours < 24) return 0.74;
  if (ageHours < 48) return 0.56;
  return 0.4;
}
function inviteMomentum(profile = {}) { return clamp(0.5 + Number(profile.invite_score || 0) * 0.35); }

export function computePersonalizedFeedScore(post, viewerProfile) {
  const prefs = viewerProfile?.feed_preferences || {};
  const ai = clamp(Number(post.ai_score || 0.5));
  const votes = clamp(Math.log10(Number(post.votes || 0) + 1) / 2);
  const quality = clamp(Number(post.quality_score || 0.5));
  const personalization = textAffinity(post.body || "", prefs);
  const trust = trustAffinity(post, prefs);
  const freshness = freshnessBias(post.created_at);
  const invite = inviteMomentum(post.profile);
  return Number((0.22*ai + 0.16*votes + 0.14*quality + 0.20*personalization + 0.12*trust + 0.10*freshness + 0.06*invite).toFixed(4));
}
export function explainPersonalizedFeed(post, viewerProfile) {
  const prefs = viewerProfile?.feed_preferences || {};
  const reasons = [];
  if (Number(post.ai_score || 0) > 0.8) reasons.push("vahva AI-arvio");
  if (Number(post.votes || 0) >= 5) reasons.push("hyvä yhteisöreaktio");
  if ((prefs.keywords || []).some((k) => String(post.body || "").toLowerCase().includes(String(k).toLowerCase()))) reasons.push("vastaa kiinnostustasi");
  if (Number(post.profile?.reputation_score || 0.5) >= 0.7) reasons.push("luotettava kirjoittaja");
  if (freshnessBias(post.created_at) > 0.85) reasons.push("tuore sisältö");
  return reasons.slice(0,3).join(", ") || "tasapainoinen suositus";
}
