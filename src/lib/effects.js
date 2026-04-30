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
    document.documentElement.style.setProperty("--reactive-press", "1");
    window.setTimeout(() => document.documentElement.style.setProperty("--reactive-press", "0"), 180);
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  return () => window.removeEventListener("pointerdown", onPointerDown);
}

export function installReactiveUI() {
  if (typeof window === "undefined") return () => {};

  const root = document.documentElement;
  let lastY = window.scrollY || 0;
  let ticking = false;
  let momentum = 0;

  function readScrollY() {
    const feedScroller = document.getElementById("feed-scroll-root");
    return feedScroller ? feedScroller.scrollTop : window.scrollY || 0;
  }

  function update() {
    const y = readScrollY();
    const delta = Math.max(-80, Math.min(80, y - lastY));
    momentum = Math.max(0, Math.min(1, Math.abs(delta) / 80));
    lastY = y;

    root.style.setProperty("--parallax-y", `${Math.max(-32, Math.min(32, y * 0.045))}px`);
    root.style.setProperty("--parallax-soft", `${Math.max(-24, Math.min(24, y * 0.025))}px`);
    root.style.setProperty("--scroll-momentum", momentum.toFixed(3));
    root.style.setProperty("--reactive-glow", (0.18 + momentum * 0.62).toFixed(3));
    root.dataset.scrollDirection = delta >= 0 ? "down" : "up";
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  function onPointerMove(event) {
    const x = event.clientX ?? window.innerWidth / 2;
    const y = event.clientY ?? window.innerHeight / 2;
    root.style.setProperty("--pointer-x", `${Math.round(x)}px`);
    root.style.setProperty("--pointer-y", `${Math.round(y)}px`);
  }

  const feedScroller = document.getElementById("feed-scroll-root");
  const scrollTarget = feedScroller || window;
  scrollTarget.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", requestUpdate, { passive: true });
  requestUpdate();

  return () => {
    scrollTarget.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("touchmove", requestUpdate);
  };
}
