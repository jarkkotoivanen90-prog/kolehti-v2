export function computeHookScore(text) {
  const first = String(text).split(/[.!?]/)[0].toLowerCase();
  let score = 0.4;
  if (first.length > 20) score += 0.15;
  if (/tarvitsen|pakko|en selviä/.test(first)) score += 0.2;
  if (/\d|€/.test(first)) score += 0.1;
  return Math.min(1, Number(score.toFixed(3)));
}
