export function installFeedUltraProMotion() {
  if (typeof window === "undefined") return () => {};

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  if (reduceMotion) return () => {};

  const root = document.documentElement;
  root.style.setProperty("--feed-pro-scale", "1.018");
  root.style.setProperty("--feed-light-x", "50%");
  root.style.setProperty("--feed-light-y", "28%");
  root.style.setProperty("--feed-swipe-energy", "0");

  // Mobile scroll must stay native-fast: no scroll/touch/gyro JS loops.
  if (coarsePointer) {
    root.dataset.feedMotionMode = "css";
    return () => {
      delete root.dataset.feedMotionMode;
      root.style.removeProperty("--feed-pro-scale");
      root.style.removeProperty("--feed-light-x");
      root.style.removeProperty("--feed-light-y");
      root.style.removeProperty("--feed-swipe-energy");
    };
  }

  let raf = 0;
  let lightX = 50;
  let lightY = 28;
  let targetLightX = 50;
  let targetLightY = 28;
  let enabled = true;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function writeVars() {
    raf = 0;
    lightX += (targetLightX - lightX) * 0.1;
    lightY += (targetLightY - lightY) * 0.1;
    root.style.setProperty("--feed-light-x", `${lightX.toFixed(1)}%`);
    root.style.setProperty("--feed-light-y", `${lightY.toFixed(1)}%`);
    if (enabled && (Math.abs(targetLightX - lightX) > 0.2 || Math.abs(targetLightY - lightY) > 0.2)) {
      raf = requestAnimationFrame(writeVars);
    }
  }

  function onPointerMove(event) {
    const x = event.clientX / Math.max(1, window.innerWidth);
    const y = event.clientY / Math.max(1, window.innerHeight);
    targetLightX = clamp(38 + x * 24, 32, 68);
    targetLightY = clamp(20 + y * 22, 18, 44);
    if (!raf) raf = requestAnimationFrame(writeVars);
  }

  root.dataset.feedMotionMode = "desktop-pointer";
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  return () => {
    enabled = false;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointerMove);
    delete root.dataset.feedMotionMode;
    root.style.removeProperty("--feed-pro-scale");
    root.style.removeProperty("--feed-light-x");
    root.style.removeProperty("--feed-light-y");
    root.style.removeProperty("--feed-swipe-energy");
  };
}
