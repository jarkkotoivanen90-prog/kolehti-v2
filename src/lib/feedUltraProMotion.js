export function installFeedUltraProMotion() {
  if (typeof window === "undefined") return () => {};

  let raf = 0;
  let lastScrollY = 0;
  let velocity = 0;
  let tiltX = 0;
  let tiltY = 0;
  let lightX = 50;
  let lightY = 28;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let targetLightX = 50;
  let targetLightY = 28;
  let enabled = true;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) return () => {};

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function writeVars() {
    raf = 0;
    tiltX += (targetTiltX - tiltX) * 0.08;
    tiltY += (targetTiltY - tiltY) * 0.08;
    lightX += (targetLightX - lightX) * 0.08;
    lightY += (targetLightY - lightY) * 0.08;

    const root = document.documentElement;
    root.style.setProperty("--feed-pro-x", `${tiltX.toFixed(2)}px`);
    root.style.setProperty("--feed-pro-y", `${tiltY.toFixed(2)}px`);
    root.style.setProperty("--feed-pro-scale", `${(1.018 + Math.min(0.018, Math.abs(velocity) / 9000)).toFixed(4)}`);
    root.style.setProperty("--feed-light-x", `${lightX.toFixed(1)}%`);
    root.style.setProperty("--feed-light-y", `${lightY.toFixed(1)}%`);
    root.style.setProperty("--feed-swipe-energy", `${Math.min(1, Math.abs(velocity) / 1800).toFixed(3)}`);

    velocity *= 0.86;
    if (enabled && (Math.abs(targetTiltX - tiltX) > 0.1 || Math.abs(targetTiltY - tiltY) > 0.1 || Math.abs(velocity) > 0.4)) {
      raf = requestAnimationFrame(writeVars);
    }
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(writeVars);
  }

  function onScroll() {
    const scroller = document.getElementById("feed-scroll-root");
    const y = scroller?.scrollTop || window.scrollY || 0;
    velocity = y - lastScrollY;
    lastScrollY = y;
    targetTiltY = clamp(-velocity / 18, -16, 16);
    targetLightY = clamp(28 + velocity / 28, 18, 42);
    schedule();
  }

  function onPointerMove(event) {
    const x = event.clientX / Math.max(1, window.innerWidth);
    const y = event.clientY / Math.max(1, window.innerHeight);
    targetTiltX = clamp((x - 0.5) * 18, -10, 10);
    targetTiltY = clamp((y - 0.5) * 12, -8, 8);
    targetLightX = clamp(36 + x * 28, 28, 72);
    targetLightY = clamp(18 + y * 28, 16, 48);
    schedule();
  }

  function onTouchMove(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    onPointerMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  function onDeviceOrientation(event) {
    if (event.gamma == null || event.beta == null) return;
    targetTiltX = clamp(event.gamma * 0.45, -10, 10);
    targetTiltY = clamp((event.beta - 45) * 0.18, -8, 8);
    targetLightX = clamp(50 + event.gamma * 0.8, 28, 72);
    targetLightY = clamp(30 + (event.beta - 45) * 0.35, 16, 48);
    schedule();
  }

  const scroller = document.getElementById("feed-scroll-root");
  scroller?.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("deviceorientation", onDeviceOrientation, { passive: true });

  return () => {
    enabled = false;
    if (raf) cancelAnimationFrame(raf);
    scroller?.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("deviceorientation", onDeviceOrientation);
    const root = document.documentElement;
    root.style.removeProperty("--feed-pro-x");
    root.style.removeProperty("--feed-pro-y");
    root.style.removeProperty("--feed-pro-scale");
    root.style.removeProperty("--feed-light-x");
    root.style.removeProperty("--feed-light-y");
    root.style.removeProperty("--feed-swipe-energy");
  };
}
