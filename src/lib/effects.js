export function haptic(type = "tap") {
  try {
    if (!navigator?.vibrate) return;
    const patterns = {
      tap: 8,
      soft: 10,
      scroll: 6,
      success: [10, 24, 10],
      heavy: [16, 34, 16]
    };
    navigator.vibrate(patterns[type] || patterns.tap);
  } catch {}
}

export function installReactiveUI() {
  if (typeof window === "undefined") return () => {};

  let lastY = window.scrollY || 0;
  let lastHaptic = 0;

  function onScroll() {
    const y = window.scrollY || 0;
    const delta = Math.abs(y - lastY);
    lastY = y;

    const now = Date.now();
    if (delta > 30 && now - lastHaptic > 140) {
      haptic("scroll");
      lastHaptic = now;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}
