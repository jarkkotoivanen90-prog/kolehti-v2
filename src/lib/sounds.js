let enabled = true;

export function toggleSound(value) {
  enabled = value;
}

function play(src, volume = 0.6) {
  if (!enabled) return;

  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {}
}

// 🔊 PUBLIC API

export function playLike() {
  play("/sounds/like.mp3", 0.5);
}

export function playShare() {
  play("/sounds/share.mp3", 0.6);
}

export function playXP() {
  play("/sounds/xp.mp3", 0.7);
}
