export function installFeedUltraProMotion() {
  if (typeof window === "undefined") return () => {};

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const root = document.documentElement;

  // --- DAILY LEADER OVERLAY ---
  let leaderEl = null;

  function ensureLeaderEl() {
    if (leaderEl) return leaderEl;
    leaderEl = document.createElement("div");
    leaderEl.style.position = "fixed";
    leaderEl.style.left = "12px";
    leaderEl.style.right = "12px";
    leaderEl.style.top = "108px";
    leaderEl.style.zIndex = "70";
    leaderEl.style.borderRadius = "18px";
    leaderEl.style.padding = "10px 12px";
    leaderEl.style.background = "rgba(0,0,0,0.55)";
    leaderEl.style.backdropFilter = "blur(12px)";
    leaderEl.style.border = "1px solid rgba(255,255,255,0.12)";
    leaderEl.style.color = "#fff";
    leaderEl.style.fontFamily = "system-ui";
    leaderEl.style.pointerEvents = "none";
    document.body.appendChild(leaderEl);
    return leaderEl;
  }

  function renderLeader(data) {
    if (!data || !data.dailyLeader) return;
    const el = ensureLeaderEl();
    const l = data.dailyLeader;
    el.innerHTML = `
      <div style="font-size:10px; font-weight:800; text-transform:uppercase; color:#fbbf24; letter-spacing:0.12em">🔥 Johtaa tänään</div>
      <div style="font-size:14px; font-weight:800; margin-top:2px">${l.author}</div>
      <div style="font-size:12px; opacity:0.75; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${l.content}</div>
      <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px; font-weight:700">
        <span>❤️ ${l.votes}</span>
        <span>💰 ${Math.round(data.dailyPot)}€</span>
      </div>
    `;
  }

  function onKolehti(e) {
    renderLeader(e.detail);
  }

  window.addEventListener("kolehti:phase1", onKolehti);

  // --- EXISTING MOTION ---

  if (reduceMotion) {
    return () => {
      window.removeEventListener("kolehti:phase1", onKolehti);
      if (leaderEl) leaderEl.remove();
    };
  }

  root.style.setProperty("--feed-pro-scale", "1.008");
  root.style.setProperty("--feed-light-x", "50%");
  root.style.setProperty("--feed-light-y", "28%");

  return () => {
    window.removeEventListener("kolehti:phase1", onKolehti);
    if (leaderEl) leaderEl.remove();
    root.style.removeProperty("--feed-pro-scale");
    root.style.removeProperty("--feed-light-x");
    root.style.removeProperty("--feed-light-y");
  };
}
