export function isSpam(text = "") {
  const t = String(text).trim().toLowerCase();
  if (t.length < 20) return true;
  if (/(.)\1\1\1/.test(t)) return true;
  if (/https?:\/\/|www\./.test(t)) return true;
  return false;
}

export function similarityScore(a = "", b = "") {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return 0;
  if (x === y) return 1;
  const xs = new Set(x.split(/\s+/));
  const ys = new Set(y.split(/\s+/));
  const intersection = [...xs].filter((w) => ys.has(w)).length;
  const union = new Set([...xs, ...ys]).size || 1;
  return intersection / union;
}

export function voteWeight({ accountAgeHours = 24, priorVotes = 0, suspicious = false }) {
  let weight = 1;
  if (accountAgeHours < 1) weight *= 0.2;
  else if (accountAgeHours < 24) weight *= 0.5;
  if (priorVotes > 20) weight *= 1.1;
  if (suspicious) weight *= 0.25;
  return Number(weight.toFixed(3));
}
