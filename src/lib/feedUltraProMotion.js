export function installFeedUltraProMotion() {
  if (typeof window === "undefined") return () => {};

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  if (reduceMotion) return () => {};

  let raf = 0;
  let lastScrollY = 0;
  let lastRun = 0;
  let velocity = 0;
  let lightX = 50;
  let lightY = 28;
  let targetLightX = 50;
  let targetLightY = 28;
  let targetEnergy = 0;
  let energy = 0;
  let enabled = true;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function writeVars(now = performance.now()) {
    raf = 0;
    lightX += (targetLightX - lightX) * 0.12;
    lightY += (targetLightY - lightY) * 0.12;
    energy += (targetEnergy - energy) * 0.14;
    targetEnergy *= 0.78;
    velocity *= 0.72;

    const root = document.documentElement;
    root.style.setProperty("--feed-pro-scale", `${(1.012 + energy * 0.012).toFixed(4)}`);
    root.style.setProperty("--feed-light-x", `${lightX.toFixed(1)}%`);
    root.style.setProperty("--feed-light-y", `${lightY.toFixed(1)}%`);
    root.style.setProperty("--feed-swipe-energy", `${energy.toFixed(3)}`);

    if (enabled && (energy > 0.015 || Math.abs(velocity) > 0.5)) {
      raf = requestAnimationFrame(writeVars);
    }
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(writeVars);
  }

  function onScroll() {
    const now = performance.now();
    if (now - lastRun < 48) return;
    lastRun = now;

    const scroller = document.getElementById("feed-scroll-root");
    const y = scroller?.scrollTop || window.scrollY || 0;
    velocity = y - lastScrollY;
    lastScrollY = y;
    targetEnergy = clamp(Math.abs(velocity) / 1400, 0, 0.75);
    targetLightY = clamp(28 + velocity / 42, 20, 40);
    schedule();
  }

  function onPointerMove(event) {
    if (coarsePointer) return;
    const x = event.clientX / Math.max(1, window.innerWidth);
    const y = event.clientY / Math.max(1, window.innerHeight);
    targetLightX = clamp(38 + x * 24, 32, 68);
    targetLightY = clamp(20 + y * 22, 18, 44);
    schedule();
  }

  const scroller = document.getElementById("feed-scroll-root");
  scroller?.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  return () => {
    enabled = false;
    if (raf) cancelAnimationFrame(raf);
    scroller?.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onPointerMove);
    const root = document.documentElement;
    root.style.removeProperty("--feed-pro-scale");
    root.style.removeProperty("--feed-light-x");
    root.style.removeProperty("--feed-light-y");
    root.style.removeProperty("--feed-swipe-energy");
  };
}
