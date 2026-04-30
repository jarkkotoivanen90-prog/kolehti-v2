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
      light: 6,
      soft: 9,
      success: [9, 20, 9],
      heavy: [14, 28, 14],
      warning: [18, 30, 18],
      reward: [8, 18, 12, 28, 18],
      heartbeat: [10, 35, 10],
      super: [8, 16, 8, 16, 28],
    };
    navigator.vibrate(patterns[type] || patterns.tap);
  } catch {}
}

export function triggerMotion(type = "tap", payload = {}) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const now = Date.now();
  root.dataset.motion = type;
  root.style.setProperty("--motion-x", `${payload.x ?? 50}%`);
  root.style.setProperty("--motion-y", `${payload.y ?? 50}%`);
  root.style.setProperty("--motion-seed", String(now));
  window.dispatchEvent(new CustomEvent("kolehti:motion", { detail: { type, ...payload, at: now } }));
  window.setTimeout(() => {
    if (root.dataset.motion === type) root.dataset.motion = "idle";
  }, payload.duration || 900);
}

export function reward(type = "success", payload = {}) {
  const hapticType = type === "superlike" ? "super" : type === "rankup" ? "reward" : type === "nearwin" ? "heartbeat" : "success";
  haptic(hapticType);
  triggerMotion(type, payload);
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
    triggerMotion("press", { x: event.clientX, y: event.clientY, duration: 240 });
    window.setTimeout(() => document.documentElement.style.setProperty("--reactive-press", "0"), 120);
  };

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  return () => window.removeEventListener("pointerdown", onPointerDown);
}

export function installReactiveUI() {
  if (typeof window === "undefined") return () => {};

  const root = document.documentElement;
  let lastY = window.scrollY || 0;
  let lastMotionAt = 0;
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

    const momentum = Math.max(0, Math.min(1, delta / 140));
    root.style.setProperty("--scroll-momentum", momentum.toFixed(3));
    root.style.setProperty("--reactive-glow", (0.08 + momentum * 0.18).toFixed(3));
    root.dataset.scrollDirection = rawDelta >= 0 ? "down" : "up";

    const now = Date.now();
    if (momentum > 0.72 && now - lastMotionAt > 1200) {
      lastMotionAt = now;
      triggerMotion("momentum", { duration: 520 });
    }

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
