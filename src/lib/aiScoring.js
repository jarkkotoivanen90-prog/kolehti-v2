// KOLEHTI AI scoring helper (frontend / edge compatible)
// Mirrors backend logic lightly for preview; real winner selection happens in SQL.

export function computeAIScore({ text = "", votes = 0, shares = 0, views = 0 }) {
  const lengthScore = Math.min(100, text.length / 10);
  const emotionScore = /!|❤️|🔥/.test(text) ? 70 : 50;
  const specificityScore = text.split(" ").length > 15 ? 70 : 50;
  const engagementScore = votes * 2 + shares * 5 + views * 0.1;

  const raw =
    lengthScore * 0.2 +
    emotionScore * 0.2 +
    specificityScore * 0.2 +
    engagementScore * 0.4;

  return Math.round(Math.min(99, raw));
}

export function explainAIScore({ score }) {
  if (score > 85) return "Erittäin vahva perustelu ja korkea yhteisön tuki";
  if (score > 70) return "Hyvä perustelu ja aktiivinen engagement";
  if (score > 50) return "Kohtalainen – voi parantua selkeydellä";
  return "Heikko näkyvyys – tarvitsee enemmän reaktioita";
}
