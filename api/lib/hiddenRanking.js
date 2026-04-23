export function publicRankLabel(rank) {
  if (rank === 1) return "Johdossa";
  if (rank <= 3) return "Top 3";
  if (rank <= 10) return "Top 10";
  return "Mukana";
}
