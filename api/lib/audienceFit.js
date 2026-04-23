export function computeAudienceFit(post) {
  const text = String(post.body || "").toLowerCase();
  let score = 0.45;
  if (/vuokra|lasku|ruoka|lapsi/.test(text)) score += 0.2;
  if (/tarvitsen|auttaisi|vaikea/.test(text)) score += 0.1;
  if (/\d|€/.test(text)) score += 0.1;
  if (text.length > 80) score += 0.05;
  return Math.min(1, Number(score.toFixed(3)));
}
