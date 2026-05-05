
let sounds = {};

export function initSounds() {
  sounds.xp = new Audio("/sounds/xp.mp3");
  sounds.rankup = new Audio("/sounds/rankup.mp3");
  sounds.target = new Audio("/sounds/target.mp3");

  Object.values(sounds).forEach((s) => {
    s.volume = 0.6;
  });
}

export function playXP() {
  sounds.xp?.play().catch(() => {});
}

export function playRankUp() {
  sounds.rankup?.play().catch(() => {});
}

export function playTarget() {
  sounds.target?.play().catch(() => {});
}
