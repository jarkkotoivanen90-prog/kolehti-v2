export const FINLAND_BACKGROUNDS = [
  "https://commons.wikimedia.org/wiki/Special:FilePath/Helsinki_skyline_(Sep_2024_-_01).jpg?width=800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Aurora_borealis_(21868630118).jpg?width=800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Road_in_Finland.jpg?width=800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=800",
];

export function finlandBg(index = 0) {
  return FINLAND_BACKGROUNDS[Math.abs(index) % FINLAND_BACKGROUNDS.length];
}

export function haptic(type = "tap") {
  try {
    if (!navigator?.vibrate) return;
    const patterns = {
      tap: 7,
      soft: 9,
      success: [9, 20, 9],
      heavy: [14, 28, 14],
      warning: [18, 30, 18],
    };
    navigator.vibrate(patterns[type] || patterns.tap);
  } catch {}
}

export function installGlobalHaptics() {
  if (typeof window === "undefined") return () => {};

  let lastTap = 0;
  const onPointerDown = (event) => {
    const target = event.target?.closest?.("button,a,[role='button'],input,textarea,select");
    if (!target) return;

    const now = Date.now();
    if (now - lastTap < 75) return;
    lastTap = now;

    haptic(target.dataset?.haptic || "tap");
    document.documentElement.style.setProperty("--reactive-press", "1");
    window.setTimeout(() => document.documentElement.style.setProperty("--reactive-press", "0"), 120);
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  return () => window.removeEventListener("pointerdown", onPointerDown);
}

export function installReactiveUI() {
  if (typeof window === "undefined") return () => {};

  const root = document.documentElement;
  let lastY = window.scrollY || 0;
  let ticking = false;

  function readScrollY() {
    const feedScroller = document.getElementById("feed-scroll-root");
    return feedScroller ? feedScroller.scrollTop : window.scrollY || 0;
  }

  function update() {
    const y = readScrollY();
    const rawDelta = y - lastY;
    const delta = Math.abs(rawDelta);
    lastY = y;

    const momentum = Math.max(0, Math.min(1, delta / 120));
    root.style.setProperty("--scroll-momentum", momentum.toFixed(3));
    root.style.setProperty("--reactive-glow", (0.10 + momentum * 0.22).toFixed(3));
    root.dataset.scrollDirection = rawDelta >= 0 ? "down" : "up";

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  const feedScroller = document.getElementById("feed-scroll-root");
  const target = feedScroller || window;
  target.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("scroll", requestUpdate, { passive: true });
  requestUpdate();

  return () => {
    target.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("scroll", requestUpdate);
  };
}
