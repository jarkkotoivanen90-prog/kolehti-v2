// src/lib/rankTargets.js

const TARGETS = [
  { xp: 50, name: "Ensimmäinen nousu" },
  { xp: 100, name: "Hyvä vire" },
  { xp: 250, name: "Nousukiito" },
  { xp: 500, name: "Top 10 taso" },
  { xp: 1000, name: "Elite" },
];

// ⚠️ Tämä versio toimii FeedTargetHintin kanssa
export async function getMyTarget(currentXP = null) {
  try {
    // jos XP:tä ei anneta → fallback demo
    const xp = currentXP ?? 120;

    const next = TARGETS.find(t => t.xp > xp);

    if (!next) return null;

    return {
      targetXP: next.xp,
      targetName: next.name,
      diff: next.xp - xp,
    };
  } catch (e) {
    console.warn("rankTargets error:", e);
    return null;
  }
}
