import { useEffect, useMemo, useRef, useState } from "react";
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
const NAV_XP_KEY = "kolehti_nav_xp_v1";

function readNavMemory() {
  try { return JSON.parse(localStorage.getItem(NAV_MEMORY_KEY) || "{}"); } catch { return {}; }
}

function saveNavMemory(memory) {
  try { localStorage.setItem(NAV_MEMORY_KEY, JSON.stringify(memory)); } catch {}
}

function readNavXp() {
  try { return Number(localStorage.getItem(NAV_XP_KEY) || 0); } catch { return 0; }
}

function saveNavXp(xp) {
  try { localStorage.setItem(NAV_XP_KEY, String(xp)); } catch {}
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

function navMode(pathname) {
  if (pathname === "/feed") return "feed";
  if (pathname === "/new") return "focus";
  if (pathname === "/pots" || pathname === "/war" || pathname === "/leaderboard") return "competitive";
  return "calm";
}

export default function AppBottomNav({ hidden = false, floating = false, gesture = false, onPulse }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [smartHidden, setSmartHidden] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [magnet, setMagnet] = useState({ x: 0, y: 0, active: false });
  const [navXp, setNavXp] = useState(() => readNavXp());
  const [burst, setBurst] = useState(false);
  const pressTimer = useRef(null);
  const burstTimer = useRef(null);
  const touchStartY = useRef(0);
  const lastY = useRef(0);
  const items = [
    { to: "/", icon: "home", label: "Koti" },
    { to: "/feed", icon: "feed", label: "Feed" },
    { to: "/new", icon: "+", label: "Uusi", fab: true },
    { to: "/pots", icon: "pots", label: "Potit" },
    { to: "/profile", icon: "profile", label: "Profiili" },
  ];
  const suggestedPath = useMemo(() => predictNext(location.pathname, items), [location.pathname]);
  const mode = navMode(location.pathname);
  const energy = Math.min(1, navXp / 40);

  useEffect(() => {
    setSmartHidden(false);
    setExpanded(false);
    setMagnet({ x: 0, y: 0, active: false });
    lastY.current = window.scrollY || 0;
  }, [location.pathname]);

  useEffect(() => () => clearTimeout(burstTimer.current), []);

  useEffect(() => {
    if (!floating) return;
    let ticking = false;

    function update() {
      ticking = false;
      const y = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const delta = y - lastY.current;
      setScrollProgress(Math.min(1, y / max));

      if (expanded) {
        setSmartHidden(false);
        lastY.current = y;
        return;
      }

      const hideThreshold = mode === "feed" ? 8 : mode === "focus" ? 18 : 10;
      const showThreshold = mode === "focus" ? -14 : -8;

      if (y < 80) setSmartHidden(false);
      else if (delta > hideThreshold) setSmartHidden(true);
      else if (delta < showThreshold) setSmartHidden(false);

      lastY.current = y;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    function onPointerMove(e) {
      if (e.clientY > window.innerHeight - 86) {
        setSmartHidden(false);
        const centerX = window.innerWidth / 2;
        const pullX = Math.max(-10, Math.min(10, (e.clientX - centerX) / 18));
        const pullY = Math.max(-7, Math.min(0, (e.clientY - window.innerHeight + 70) / 10));
        setMagnet({ x: pullX, y: pullY, active: true });
      } else if (magnet.active) {
        setMagnet({ x: 0, y: 0, active: false });
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [floating, expanded, mode, magnet.active]);

  if (!floating) return null;

  function rememberClick(to) {
    const memory = readNavMemory();
    memory[to] = Number(memory[to] || 0) + 1;
    saveNavMemory(memory);
  }

  function addNavXp(amount = 1) {
    const next = Math.min(40, readNavXp() + amount);
    saveNavXp(next);
    setNavXp(next);
    setBurst(true);
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(false), 700);
  }

  function pulse(type = "tap", to) {
    if (to) rememberClick(to);
    addNavXp(type === "heavy" ? 3 : 1);
    haptic(type);
    onPulse?.();
  }

  function startPress() {
    if (!gesture || !floating) return;
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setExpanded(true);
      setSmartHidden(false);
      addNavXp(2);
      haptic("heavy");
    }, 420);
  }

  function endPress() { clearTimeout(pressTimer.current); }

  function onTouchStart(e) {
    touchStartY.current = e.touches?.[0]?.clientY || 0;
    if (touchStartY.current > window.innerHeight - 120) setSmartHidden(false);
    startPress();
  }

  function onTouchMove(e) {
    const touch = e.touches?.[0];
    if (!touch) return;
    if (touch.clientY > window.innerHeight - 132) {
      const centerX = window.innerWidth / 2;
      setMagnet({ x: Math.max(-12, Math.min(12, (touch.clientX - centerX) / 18)), y: -4, active: true });
    }
  }

  function onTouchEnd(e) {
    endPress();
    setMagnet({ x: 0, y: 0, active: false });
    const endY = e.changedTouches?.[0]?.clientY || touchStartY.current;
    const delta = endY - touchStartY.current;
    if (!gesture || !floating) return;
    if (delta > 26) { setExpanded(false); setSmartHidden(true); haptic("tap"); }
    else if (delta < -26) { setExpanded(true); setSmartHidden(false); addNavXp(2); haptic("tap"); }
  }

  const isHidden = (hidden || smartHidden) && !expanded;
  const modeGlow = mode === "competitive" ? "rgba(250,204,21,.18)" : mode === "focus" ? "rgba(34,211,238,.22)" : mode === "feed" ? "rgba(59,130,246,.22)" : "rgba(139,238,255,.18)";

  return (
    <nav
      gesture-nav="true"
      data-nav-mode={mode}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={() => { endPress(); setMagnet({ x: 0, y: 0, active: false }); }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-[70] text-white transition-all duration-500 ease-[cubic-bezier(.2,.9,.2,1)] ${expanded ? "w-[calc(100%-28px)] max-w-[360px]" : "w-[min(276px,calc(100%-72px))] max-w-[276px]"} ${isHidden ? "translate-y-[calc(100%+10px)] opacity-0 scale-95 pointer-events-none" : "translate-y-0 opacity-100 scale-100"} -translate-x-1/2`}
      style={{
        filter: `brightness(${1 + scrollProgress * 0.05 + energy * 0.04})`,
        marginLeft: `${magnet.x}px`,
        marginBottom: `${magnet.y}px`,
      }}
    >
      <div className={`relative overflow-hidden border border-white/14 bg-[#020611]/64 shadow-2xl shadow-black/45 backdrop-blur-2xl transition-all duration-300 ${expanded ? "rounded-[28px] px-3 py-2.5" : "rounded-full px-3 py-2"}`}>
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 50% 0%, ${modeGlow}, transparent 48%)` }} />
        <div className={`pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,.10)_45%,transparent_60%)] transition-transform duration-700 ${burst ? "translate-x-[35%] opacity-100" : "-translate-x-[75%] opacity-0"}`} />
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/60 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-cyan-300/70 transition-all duration-300" style={{ width: `${Math.round(Math.max(scrollProgress, energy) * 100)}%` }} />
        {expanded && <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full border border-cyan-200/16 bg-black/42 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-100/62 backdrop-blur-xl">AI next · {mode}</div>}
        <div className={`relative grid grid-cols-5 items-center gap-1 text-center font-black transition-all duration-300 ${expanded ? "text-[10px]" : "text-[0px]"}`}>
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
