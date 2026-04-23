export function buildReasonEngineResult(post) {
  const reasons = [];
  if (Number(post.ai_score || 0) >= 0.8) reasons.push("vahva ja uskottava perustelu");
  if (Number(post.quality_score || 0) >= 0.75) reasons.push("hyvä laatu");
  if (Number(post.votes || 0) >= 5) reasons.push("yhteisön tuki");
  if (Number(post.audience_fit_score || 0) >= 0.7) reasons.push("sopii yleisölle");
  if (Number(post.hook_score || 0) >= 0.7) reasons.push("vahva aloitus");
  return {
    reason_summary: reasons.length ? `Perustelu menestyi koska siinä oli ${reasons.join(", ")}.` : "Perustelu oli tasapainoinen kokonaisuus.",
    win_reason: reasons.slice(0,3).join(", ") || "tasapainoinen kokonaisuus",
  };
}
