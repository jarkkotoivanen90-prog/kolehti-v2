export function buildRoundInsight(posts) {
  if (!posts?.length) return { insight_type: "summary", content: "Ei tarpeeksi dataa kierroksesta.", data: {} };
  const avgLength = posts.reduce((sum, p) => sum + String(p.body || "").length, 0) / posts.length;
  return {
    insight_type: "summary",
    content: avgLength > 100 ? "Pitkät perustelut toimivat tällä kierroksella." : "Lyhyet perustelut toimivat tällä kierroksella.",
    data: { average_length: Number(avgLength.toFixed(1)) },
  };
}
