export const FINLAND_BACKGROUNDS = [
  "https://commons.wikimedia.org/wiki/Special:FilePath/Helsinki_skyline_(Sep_2024_-_01).jpg?width=1400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=1400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Aurora_borealis_(21868630118).jpg?width=1400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Road_in_Finland.jpg?width=1400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1400",
];

export function finlandBg(index = 0) {
  return FINLAND_BACKGROUNDS[Math.abs(index) % FINLAND_BACKGROUNDS.length];
}

export function haptic(type = "tap") {
  try {
    if (!navigator?.vibrate) return;
    const patterns = {
      tap: 8,
      soft: 12,
      success: [10, 24, 10],
      heavy: [16, 34, 16],
      warning: [28, 40, 28],
    };
    navigator.vibrate(patterns[type] || patterns.tap);
  } catch {}
}

export function installGlobalHaptics() {
  if (typeof window === "undefined") return () => {};

  const onPointerDown = (event) => {
    const target = event.target?.closest?.("button,a,[role='button'],input,textarea,select");
    if (!target) return;
    haptic(target.dataset?.haptic || "tap");
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  return () => window.removeEventListener("pointerdown", onPointerDown);
}
