// src/lib/soundEngine.js

export function playTarget() {
  try {
    const audio = new Audio("/sounds/xp.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (e) {
    console.log("sound fail", e);
  }
}
