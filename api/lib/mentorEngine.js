export function buildMentorFeedback(post) {
  const strengths = [];
  const improvements = [];
  if (post.ai_score > 0.7) strengths.push("selkeä ja uskottava perustelu");
  else improvements.push("tee perustelusta konkreettisempi");
  if (post.hook_score < 0.6) improvements.push("paranna aloituslausetta");
  else strengths.push("hyvä aloitus");
  return {
    feedback: `Vahvuudet: ${strengths.join(", ") || "tasapaino"}. Kehitä: ${improvements.join(", ") || "jatka samalla linjalla"}.`,
    strengths, improvements,
  };
}
