const TARGETS = [
  { xp: 50, name: "Ensimmäinen nousu" },
  { xp: 100, name: "Hyvä vire" },
  { xp: 250, name: "Nousukiito" },
  { xp: 500, name: "Top 10 taso" },
  { xp: 1000, name: "Elite" },
];

export function getMyTarget(currentXP = 0) {
  const xp = currentXP ?? 0;

  const next = TARGETS.find((t) => t.xp > xp);

  if (!next) return null;

  return {
    targetXP: next.xp,
    targetName: next.name,
    diff: next.xp - xp,
  };
}
