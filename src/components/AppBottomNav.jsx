import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { haptic } from "../lib/effects";

function Icon({ type, active, suggested }) {
  const cls = `h-5 w-5 ${active ? "text-cyan-100 drop-shadow-[0_0_10px_rgba(125,220,255,.45)]" : suggested ? "text-cyan-100/85 drop-shadow-[0_0_12px_rgba(125,220,255,.35)]" : "text-white/58"}`;
  const common = { className: cls, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.15", strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "home") return <svg {...common}><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 10.5V21h13V10.5"/><path d="M9.5 21v-6h5v6"/></svg>;
  if (type === "feed") return <svg {...common}><path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-2.8 2-5 2-5s.4 2.1 2.4 3.2C11.5 7.8 12 3 12 3Z"/></svg>;
  if (type === "pots") return <svg {...common}><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 0 5H8"/><path d="M17 6h2.5a2.5 2.5 0 0 1 0 5H16"/></svg>;
  if (type === "profile") return <svg {...common}><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>;
  return null;
}

const NAV_MEMORY_KEY = "kolehti_ai_nav_memory_v1";

function readNavMemory() {
  try { return JSON.parse(localStorage.getItem(NAV_MEMORY_KEY) || "{}"); } catch { return {}; }
}

function saveNavMemory(memory) {
  try { localStorage.setItem(NAV_MEMORY_KEY, JSON.stringify(memory)); } catch {}
}

function predictNext(pathname, items) {
  const memory = readNavMemory();
  const scores = Object.fromEntries(items.map((item) => [item.to, Number(memory[item.to] || 0)]));
  const flowBoosts = {
    "/": { "/feed": 8, "/new": 3 },
    "/feed": { "/new": 9, "/pots": 5, "/profile": 2 },
    "/new": { "/feed": 10, "/pots": 4 },
    "/pots": { "/feed": 7, "/new": 5 },
    "/profile": { "/feed": 6, "/new": 4 },
    "/vote": { "/feed": 6, "/pots": 5 },
    "/groups": { "/feed": 5, "/new": 4 },
    "/leaderboard": { "/pots": 7, "/feed": 4 },
    "/growth": { "/new": 6, "/feed": 5 },
    "/war": { "/pots": 8, "/feed": 3 },
  };
  const boosts = flowBoosts[pathname] || flowBoosts["/"];
  for (const [target, boost] of Object.entries(boosts)) scores[target] = Number(scores[target] || 0) + boost;
  delete scores[pathname];
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "/feed";
}

export default function AppBottomNav({ hidden = false, floating = false, gesture = false, onPulse }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const pressTimer = useRef(null);
  const touchStartY = useRef(0);
  const items = [
    { to: "/", icon: "home", label: "Koti" },
    { to: "/feed", icon: "feed", label: "Feed" },
    { to: "/new", icon: "+", label: "Uusi", fab: true },
    { to: "/pots", icon: "pots", label: "Potit" },
    { to: "/profile", icon: "profile", label: "Profiili" },
  ];
  const suggestedPath = useMemo(() => predictNext(location.pathname, items), [location.pathname]);

  // Unified nav rule: only the floating global nav is allowed to render.
  // Old page-level non-floating nav usages become no-ops to prevent duplicates.
  if (!floating) return null;

  function rememberClick(to) {
    const memory = readNavMemory();
    memory[to] = Number(memory[to] || 0) + 1;
    saveNavMemory(memory);
  }

  function pulse(type = "tap", to) {
    if (to) rememberClick(to);
    haptic(type);
    onPulse?.();
  }

  function startPress() {
    if (!gesture || !floating) return;
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setExpanded(true);
      haptic("heavy");
    }, 420);
  }

  function endPress() { clearTimeout(pressTimer.current); }

  function onTouchStart(e) {
    touchStartY.current = e.touches?.[0]?.clientY || 0;
    startPress();
  }

  function onTouchEnd(e) {
    endPress();
    const endY = e.changedTouches?.[0]?.clientY || touchStartY.current;
    const delta = endY - touchStartY.current;
    if (!gesture || !floating) return;
    if (delta > 26) { setExpanded(false); haptic("tap"); }
    else if (delta < -26) { setExpanded(true); haptic("tap"); }
  }

  return (
    <nav
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-[70] text-white transition-all duration-300 ${expanded ? "w-[calc(100%-28px)] max-w-[360px]" : "w-[min(276px,calc(100%-72px))] max-w-[276px]"} ${hidden && !expanded ? "translate-y-[94%] opacity-55" : "translate-y-0 opacity-100"} -translate-x-1/2`}
    >
      <div className={`relative border border-white/14 bg-[#020611]/64 shadow-2xl shadow-black/45 backdrop-blur-2xl transition-all duration-300 ${expanded ? "rounded-[28px] px-3 py-2.5" : "rounded-full px-3 py-2"}`}>
        {expanded && <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full border border-cyan-200/16 bg-black/42 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/62 backdrop-blur-xl">AI next</div>}
        <div className={`grid grid-cols-5 items-center gap-1 text-center font-black transition-all duration-300 ${expanded ? "text-[10px]" : "text-[0px]"}`}>
          {items.map((item) => {
            const active = location.pathname === item.to;
            const suggested = !active && suggestedPath === item.to;
            if (item.fab) {
              return (
                <Link key={item.to} to={item.to} onClick={() => pulse("heavy", item.to)} className="relative flex flex-col items-center justify-center text-white">
                  {suggested && <span className="absolute -top-1 h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(139,238,255,.85)]" />}
                  <div className={`grid place-items-center rounded-full border font-black leading-none shadow-lg transition-all duration-300 ${suggested ? "border-cyan-100/60 bg-gradient-to-br from-white via-cyan-200 to-blue-600 shadow-cyan-300/45" : "border-cyan-100/30 bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-700 shadow-cyan-500/25"} ${expanded ? "h-14 w-14 text-4xl" : "h-12 w-12 text-3xl"}`}>+</div>
                  {expanded && <span className="mt-1 leading-none">Uusi</span>}
                </Link>
              );
            }
            return (
              <Link key={item.to} to={item.to} onClick={() => pulse("tap", item.to)} className={`relative flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 ${active ? "bg-cyan-300/12 text-cyan-100" : suggested ? "bg-cyan-300/8 text-cyan-100/85" : "text-white/55"}`}>
                {suggested && <span className="absolute -top-0.5 right-2 h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(139,238,255,.85)]" />}
                <Icon type={item.icon} active={active} suggested={suggested} />
                {expanded && <span className="leading-none">{item.label}</span>}
              </Link>
            );
          })}
        </div>
        {gesture && !expanded && <div className="absolute -top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/28" />}
      </div>
    </nav>
  );
}
