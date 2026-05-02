let installed = false;
let cleanupFns = [];

const STORAGE_KEY = "kolehti_feed_streak_v1";

function safeParse(value, fallback) {
  try { return JSON.parse(value) || fallback; } catch { return fallback; }
}

function getState() {
  if (typeof window === "undefined") return { actions: 0, streak: 0, lastDay: "" };
  const today = new Date().toISOString().slice(0, 10);
  const stored = safeParse(window.localStorage?.getItem(STORAGE_KEY), { actions: 0, streak: 0, lastDay: "" });
  if (stored.lastDay !== today) return { actions: 0, streak: Math.max(0, Number(stored.streak || 0)), lastDay: today };
  return { actions: Number(stored.actions || 0), streak: Number(stored.streak || 0), lastDay: today };
}

function saveState(state) {
  try { window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function makeEl(className, text = "") {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  return el;
}

function injectStyles() {
  if (document.getElementById("kolehti-addiction-layer-styles")) return;
  const style = document.createElement("style");
  style.id = "kolehti-addiction-layer-styles";
  style.textContent = `
    .kolehti-retention-pill {
      position: fixed;
      left: 50%;
      bottom: calc(env(safe-area-inset-bottom) + 18px);
      z-index: 70;
      transform: translateX(-50%) translateY(12px);
      opacity: 0;
      pointer-events: none;
      min-width: 190px;
      max-width: 78vw;
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 999px;
      background: rgba(3, 8, 22, .58);
      box-shadow: 0 18px 48px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.12);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      padding: 9px 12px;
      color: white;
      transition: opacity .22s ease, transform .22s ease;
      font-family: inherit;
    }
    .kolehti-retention-pill.is-visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .kolehti-retention-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: rgba(207,250,254,.82);
    }
    .kolehti-retention-bar {
      position: relative;
      overflow: hidden;
      height: 5px;
      margin-top: 7px;
      border-radius: 999px;
      background: rgba(255,255,255,.10);
    }
    .kolehti-retention-fill {
      height: 100%;
      width: var(--kolehti-progress, 0%);
      border-radius: inherit;
      background: linear-gradient(90deg, rgba(103,232,249,.72), rgba(255,255,255,.88));
      box-shadow: 0 0 18px rgba(103,232,249,.32);
      transition: width .24s ease;
    }
    .kolehti-mini-toast {
      position: fixed;
      left: 50%;
      top: 132px;
      z-index: 75;
      transform: translateX(-50%) translateY(-8px);
      opacity: 0;
      pointer-events: none;
      border: 1px solid rgba(125,211,252,.18);
      border-radius: 999px;
      background: rgba(3, 8, 22, .64);
      color: rgba(236,254,255,.92);
      box-shadow: 0 14px 42px rgba(0,0,0,.28);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      padding: 8px 13px;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
      transition: opacity .18s ease, transform .18s ease;
    }
    .kolehti-mini-toast.is-visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      .kolehti-retention-pill, .kolehti-mini-toast, .kolehti-retention-fill { transition: none; }
    }
  `;
  document.head.appendChild(style);
}

function createOverlay() {
  injectStyles();
  const pill = makeEl("kolehti-retention-pill");
  const row = makeEl("kolehti-retention-row");
  const label = makeEl("", "Feed streak");
  const count = makeEl("", "0/5");
  const bar = makeEl("kolehti-retention-bar");
  const fill = makeEl("kolehti-retention-fill");
  const toast = makeEl("kolehti-mini-toast", "+1 momentum");
  bar.appendChild(fill);
  row.appendChild(label);
  row.appendChild(count);
  pill.appendChild(row);
  pill.appendChild(bar);
  document.body.appendChild(pill);
  document.body.appendChild(toast);
  return { pill, count, toast };
}

export function installFeedAddictionLayer() {
  if (typeof window === "undefined" || installed) return () => {};
  installed = true;
  const overlay = createOverlay();
  let state = getState();
  let hideTimer = 0;
  let toastTimer = 0;

  function render(show = false, message = "+1 momentum") {
    const progress = Math.min(5, state.actions % 5 || (state.actions ? 5 : 0));
    overlay.count.textContent = `${progress}/5`;
    overlay.pill.style.setProperty("--kolehti-progress", `${(progress / 5) * 100}%`);
    if (show) {
      overlay.pill.classList.add("is-visible");
      overlay.toast.textContent = message;
      overlay.toast.classList.add("is-visible");
      clearTimeout(hideTimer);
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => overlay.toast.classList.remove("is-visible"), 900);
      hideTimer = window.setTimeout(() => overlay.pill.classList.remove("is-visible"), 1800);
    }
  }

  function reward(type) {
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastDay !== today) state = { actions: 0, streak: state.streak || 0, lastDay: today };
    state.actions += 1;
    if (state.actions === 1) state.streak += 1;
    saveState(state);
    const milestone = state.actions % 5 === 0;
    render(true, milestone ? "🔥 bonus unlocked" : type === "like" ? "+1 vote energy" : type === "open" ? "+1 deep view" : "+1 momentum");
  }

  function onClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!document.getElementById("feed-scroll-root")) return;
    const actionButton = target.closest("aside button");
    if (actionButton) {
      const text = actionButton.textContent || "";
      reward(text.includes("♥") ? "like" : "action");
      return;
    }
    const feedCard = target.closest(".feed-card");
    if (feedCard) reward("open");
  }

  document.addEventListener("click", onClick, { passive: true });
  render(false);

  const cleanup = () => {
    document.removeEventListener("click", onClick);
    clearTimeout(hideTimer);
    clearTimeout(toastTimer);
    overlay.pill.remove();
    overlay.toast.remove();
    installed = false;
  };
  cleanupFns.push(cleanup);
  return cleanup;
}

export function uninstallFeedAddictionLayer() {
  cleanupFns.splice(0).forEach((fn) => fn());
}
