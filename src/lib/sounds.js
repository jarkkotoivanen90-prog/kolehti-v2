let enabled = true;

export function toggleSound(on) {
  enabled = Boolean(on);
}

function play(src, volume = 0.5) {
  if (!enabled) return;

  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {}
}

export function playXP() {
  play("/sounds/xp.mp3", 0.35);
}

export function playRankUp() {
  play("/sounds/rankup.mp3", 0.6);
}

export function playTarget() {
  play("/sounds/target.mp3", 0.45);
}
