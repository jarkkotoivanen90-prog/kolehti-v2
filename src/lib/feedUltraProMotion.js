export function installFeedUltraProMotion() {
  if (typeof window === "undefined") return () => {};

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  if (reduceMotion) return () => {};

  const root = document.documentElement;
  root.style.setProperty("--feed-pro-scale", "1.008");
  root.style.setProperty("--feed-light-x", "50%");
  root.style.setProperty("--feed-light-y", "28%");
  root.style.setProperty("--feed-card-light-x", "22%");
  root.style.setProperty("--feed-card-light-y", "0%");
  root.style.setProperty("--feed-card-tilt-x", "0deg");
  root.style.setProperty("--feed-card-tilt-y", "0deg");
  root.style.setProperty("--feed-swipe-energy", "0");

  // Mobile must stay silky: no continuous touchmove / pointermove loops.
  if (coarsePointer) {
    root.dataset.feedMotionMode = "mobile-css-only";
    return () => {
      delete root.dataset.feedMotionMode;
      root.style.removeProperty("--feed-pro-scale");
      root.style.removeProperty("--feed-light-x");
      root.style.removeProperty("--feed-light-y");
      root.style.removeProperty("--feed-card-light-x");
      root.style.removeProperty("--feed-card-light-y");
      root.style.removeProperty("--feed-card-tilt-x");
      root.style.removeProperty("--feed-card-tilt-y");
      root.style.removeProperty("--feed-swipe-energy");
    };
  }

  let raf = 0;
  let idleTimer = 0;
  let lightX = 50;
  let lightY = 28;
  let cardLightX = 22;
  let cardLightY = 0;
  let targetLightX = 50;
  let targetLightY = 28;
  let targetCardLightX = 22;
  let targetCardLightY = 0;
  let enabled = true;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function writeVars() {
    raf = 0;
    lightX += (targetLightX - lightX) * 0.12;
    lightY += (targetLightY - lightY) * 0.12;
    cardLightX += (targetCardLightX - cardLightX) * 0.12;
    cardLightY += (targetCardLightY - cardLightY) * 0.12;

    root.style.setProperty("--feed-light-x", `${lightX.toFixed(1)}%`);
    root.style.setProperty("--feed-light-y", `${lightY.toFixed(1)}%`);
    root.style.setProperty("--feed-card-light-x", `${cardLightX.toFixed(1)}%`);
    root.style.setProperty("--feed-card-light-y", `${cardLightY.toFixed(1)}%`);

    if (
      enabled &&
      (Math.abs(targetLightX - lightX) > 0.2 ||
        Math.abs(targetLightY - lightY) > 0.2 ||
        Math.abs(targetCardLightX - cardLightX) > 0.2 ||
        Math.abs(targetCardLightY - cardLightY) > 0.2)
    ) {
      raf = requestAnimationFrame(writeVars);
    }
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(writeVars);
  }

  function resetSoftly() {
    targetLightX = 50;
    targetLightY = 28;
    targetCardLightX = 22;
    targetCardLightY = 0;
    root.style.setProperty("--feed-swipe-energy", "0");
    schedule();
  }

  function updateFromPoint(clientX, clientY) {
    const x = clientX / Math.max(1, window.innerWidth);
    const y = clientY / Math.max(1, window.innerHeight);
    targetLightX = clamp(38 + x * 24, 32, 68);
    targetLightY = clamp(20 + y * 22, 18, 44);
    targetCardLightX = clamp(x * 100, 8, 92);
    targetCardLightY = clamp(y * 100, 0, 90);
    root.style.setProperty("--feed-swipe-energy", "0.14");
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(resetSoftly, 650);
    schedule();
  }

  function onPointerMove(event) {
    updateFromPoint(event.clientX, event.clientY);
  }

  root.dataset.feedMotionMode = "desktop-interactive-light";
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  return () => {
    enabled = false;
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(idleTimer);
    window.removeEventListener("pointermove", onPointerMove);
    delete root.dataset.feedMotionMode;
    root.style.removeProperty("--feed-pro-scale");
    root.style.removeProperty("--feed-light-x");
    root.style.removeProperty("--feed-light-y");
    root.style.removeProperty("--feed-card-light-x");
    root.style.removeProperty("--feed-card-light-y");
    root.style.removeProperty("--feed-card-tilt-x");
    root.style.removeProperty("--feed-card-tilt-y");
    root.style.removeProperty("--feed-swipe-energy");
  };
}
