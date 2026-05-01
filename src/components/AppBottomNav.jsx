import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { haptic } from "../lib/effects";

function Icon({ type, active }) {
  const cls = `h-5 w-5 ${active ? "text-cyan-100 drop-shadow-[0_0_10px_rgba(125,220,255,.45)]" : "text-white/58"}`;
  const common = { className: cls, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.15", strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "home") return <svg {...common}><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 10.5V21h13V10.5"/><path d="M9.5 21v-6h5v6"/></svg>;
  if (type === "feed") return <svg {...common}><path d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-2.8 2-5 2-5s.4 2.1 2.4 3.2C11.5 7.8 12 3 12 3Z"/></svg>;
  if (type === "pots") return <svg {...common}><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 0 5H8"/><path d="M17 6h2.5a2.5 2.5 0 0 1 0 5H16"/></svg>;
  if (type === "profile") return <svg {...common}><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>;
  return null;
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

  function pulse(type = "tap") {
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

  function endPress() {
    clearTimeout(pressTimer.current);
  }

  function onTouchStart(e) {
    touchStartY.current = e.touches?.[0]?.clientY || 0;
    startPress();
  }

  function onTouchEnd(e) {
    endPress();
    const endY = e.changedTouches?.[0]?.clientY || touchStartY.current;
    const delta = endY - touchStartY.current;
    if (!gesture || !floating) return;
    if (delta > 26) {
      setExpanded(false);
      haptic("tap");
    } else if (delta < -26) {
      setExpanded(true);
      haptic("tap");
    }
  }

  if (floating) {
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
          <div className={`grid grid-cols-5 items-center gap-1 text-center font-black transition-all duration-300 ${expanded ? "text-[10px]" : "text-[0px]"}`}>
            {items.map((item) => {
              const active = location.pathname === item.to;
              if (item.fab) {
                return (
                  <Link key={item.to} to={item.to} onClick={() => pulse("heavy")} className="flex flex-col items-center justify-center text-white">
                    <div className={`grid place-items-center rounded-full border border-cyan-100/30 bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-700 font-black leading-none shadow-lg shadow-cyan-500/25 transition-all duration-300 ${expanded ? "h-14 w-14 text-4xl" : "h-12 w-12 text-3xl"}`}>+</div>
                    {expanded && <span className="mt-1 leading-none">Uusi</span>}
                  </Link>
                );
              }
              return (
                <Link key={item.to} to={item.to} onClick={() => pulse()} className={`flex flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 ${active ? "bg-cyan-300/12 text-cyan-100" : "text-white/55"}`}>
                  <Icon type={item.icon} active={active} />
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

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-md px-5 pb-[max(14px,env(safe-area-inset-bottom))] text-white transition-transform duration-300 ${hidden ? "translate-y-[120%]" : "translate-y-0"}`}>
      <div className="kolehti-bottom-shell relative rounded-[30px] px-4 pb-4 pt-3">
        <div className="grid grid-cols-5 items-end text-center text-[11px] font-black">
          {items.map((item) => {
            const active = location.pathname === item.to;
            if (item.fab) {
              return (
                <Link key={item.to} to={item.to} onClick={() => pulse("heavy")} className="-mt-10 flex flex-col items-center text-white">
                  <div className="grid h-[78px] w-[78px] place-items-center rounded-full border-[6px] border-[#061126] bg-gradient-to-br from-cyan-100 via-sky-400 to-blue-700 text-[54px] font-black leading-none shadow-lg shadow-blue-500/25">+</div>
                  <div className="mt-1">{item.label}</div>
                </Link>
              );
            }
            return (
              <Link key={item.to} to={item.to} onClick={() => pulse()} className={`flex flex-col items-center gap-1 ${active ? "text-cyan-200" : "text-white/48"}`}>
                <div className={`grid h-10 w-10 place-items-center rounded-2xl border ${active ? "border-cyan-200/18 bg-cyan-300/10 shadow-[0_0_18px_rgba(125,220,255,.16)]" : "border-white/5 bg-white/[.035]"}`}>
                  <Icon type={item.icon} active={active} />
                </div>
                <div>{item.label}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
