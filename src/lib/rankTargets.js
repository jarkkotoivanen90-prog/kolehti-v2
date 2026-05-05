// src/lib/rankTargets.js

const TARGETS = [
  { xp: 50, label: "Ensimmäinen nousu" },
  { xp: 100, label: "Hyvä vire" },
  { xp: 250, label: "Nousukiito" },
  { xp: 500, label: "Top 10 taso" },
  { xp: 1000, label: "Elite" },
];

export function getMyTarget(currentXP = 0) {
  const next = TARGETS.find(t => t.xp > currentXP);
  return next || TARGETS[TARGETS.length - 1];
}
