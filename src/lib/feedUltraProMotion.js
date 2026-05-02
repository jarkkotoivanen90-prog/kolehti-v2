export function installFeedUltraProMotion() {
  if (typeof window === "undefined") return () => {};

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) return () => {};

  const root = document.documentElement;
  root.style.setProperty("--feed-pro-scale", "1.012");
  root.style.setProperty("--feed-light-x", "50%");
  root.style.setProperty("--feed-light-y", "28%");
  root.style.setProperty("--feed-card-light-x", "22%");
  root.style.setProperty("--feed-card-light-y", "0%");
  root.style.setProperty("--feed-card-tilt-x", "0deg");
  root.style.setProperty("--feed-card-tilt-y", "0deg");
  root.style.setProperty("--feed-swipe-energy", "0");

  let raf = 0;
  let idleTimer = 0;
  let lightX = 50;
  let lightY = 28;
  let cardLightX = 22;
  let cardLightY = 0;
  let tiltX = 0;
  let tiltY = 0;
  let targetLightX = 50;
  let targetLightY = 28;
  let targetCardLightX = 22;
  let targetCardLightY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let enabled = true;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function writeVars() {
    raf = 0;
    lightX += (targetLightX - lightX) * 0.14;
    lightY += (targetLightY - lightY) * 0.14;
    cardLightX += (targetCardLightX - cardLightX) * 0.16;
    cardLightY += (targetCardLightY - cardLightY) * 0.16;
    tiltX += (targetTiltX - tiltX) * 0.14;
    tiltY += (targetTiltY - tiltY) * 0.14;

    root.style.setProperty("--feed-light-x", `${lightX.toFixed(1)}%`);
    root.style.setProperty("--feed-light-y", `${lightY.toFixed(1)}%`);
    root.style.setProperty("--feed-card-light-x", `${cardLightX.toFixed(1)}%`);
    root.style.setProperty("--feed-card-light-y", `${cardLightY.toFixed(1)}%`);
    root.style.setProperty("--feed-card-tilt-x", `${tiltX.toFixed(2)}deg`);
    root.style.setProperty("--feed-card-tilt-y", `${tiltY.toFixed(2)}deg`);

    if (
      enabled &&
      (Math.abs(targetLightX - lightX) > 0.15 ||
        Math.abs(targetLightY - lightY) > 0.15 ||
        Math.abs(targetCardLightX - cardLightX) > 0.15 ||
        Math.abs(targetCardLightY - cardLightY) > 0.15 ||
        Math.abs(targetTiltX - tiltX) > 0.02 ||
        Math.abs(targetTiltY - tiltY) > 0.02)
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
    targetTiltX = 0;
    targetTiltY = 0;
    schedule();
  }

  function updateFromPoint(clientX, clientY) {
    const x = clientX / Math.max(1, window.innerWidth);
    const y = clientY / Math.max(1, window.innerHeight);
    targetLightX = clamp(38 + x * 24, 32, 68);
    targetLightY = clamp(20 + y * 22, 18, 44);
    targetCardLightX = clamp(x * 100, 8, 92);
    targetCardLightY = clamp(y * 100, 0, 90);
    targetTiltX = clamp((0.5 - y) * 1.6, -0.9, 0.9);
    targetTiltY = clamp((x - 0.5) * 1.8, -1.0, 1.0);
    root.style.setProperty("--feed-swipe-energy", "0.22");
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      root.style.setProperty("--feed-swipe-energy", "0");
      resetSoftly();
    }, 850);
    schedule();
  }

  function onPointerMove(event) {
    updateFromPoint(event.clientX, event.clientY);
  }

  function onTouchStart(event) {
    const touch = event.touches?.[0];
    if (touch) updateFromPoint(touch.clientX, touch.clientY);
  }

  function onTouchMove(event) {
    const touch = event.touches?.[0];
    if (touch) updateFromPoint(touch.clientX, touch.clientY);
  }

  root.dataset.feedMotionMode = "interactive-light";
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });

  return () => {
    enabled = false;
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(idleTimer);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
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
