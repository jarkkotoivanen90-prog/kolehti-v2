export function detectPlayerDNA(posts) {
  const text = posts.map((p) => p.body || "").join(" ").toLowerCase();
  if ((text.match(/tarvitsen|auttaisi/g) || []).length > 5) return { player_dna: "Emotionaalinen", persuasion_style: "Tunteisiin vetoava" };
  if ((text.match(/\d|€/g) || []).length > 10) return { player_dna: "Looginen", persuasion_style: "Faktoihin perustuva" };
  return { player_dna: "Tasapainoinen", persuasion_style: "Sekoitus tunnetta ja logiikkaa" };
}
