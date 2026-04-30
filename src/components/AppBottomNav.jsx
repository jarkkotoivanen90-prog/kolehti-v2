import { Link, useLocation } from "react-router-dom";

export default function AppBottomNav({ hidden = false, onPulse }) {
  const location = useLocation();
  const items = [
    { to: "/", icon: "⌂", label: "Koti", alive: true },
    { to: "/feed", icon: "🔥", label: "Feed", badge: "LIVE" },
    { to: "/new", icon: "+", label: "Uusi", fab: true },
    { to: "/pots", icon: "🏆", label: "Potit", badge: "HOT", gold: true },
    { to: "/profile", icon: "●", label: "Profiili", alive: true },
  ];

  return (
    <>
      <style>{`
        @keyframes navAlive{0%,100%{opacity:.74;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}
        @keyframes plusPulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.055)}}
        .nav-alive{animation:navAlive 2.5s ease-in-out infinite}
        .plus-pulse{animation:plusPulse 2.25s ease-in-out infinite}
      `}</style>

      <nav className={`fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-md px-5 pb-[max(14px,env(safe-area-inset-bottom))] text-white transition-transform duration-300 ease-out ${hidden ? "translate-y-[132%]" : "translate-y-0"}`}>
        <div className="relative rounded-[34px] border border-cyan-200/20 bg-[#061126]/92 px-4 pb-4 pt-3 shadow-2xl shadow-cyan-500/15 backdrop-blur-2xl">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
          <div className="grid grid-cols-5 items-end text-center text-[11px] font-black">
            {items.map((item) => {
              const active = location.pathname === item.to;
              if (item.fab) {
                return (
                  <Link onClick={onPulse} key={item.to} to={item.to} className="-mt-12 flex flex-col items-center active:scale-95">
                    <div className="plus-pulse grid h-[86px] w-[86px] place-items-center rounded-full border-[7px] border-[#061126] bg-gradient-to-br from-cyan-100 via-sky-400 to-blue-700 text-[62px] font-black leading-none shadow-2xl shadow-cyan-400/50">+</div>
                    <div className="mt-0.5 text-white">{item.label}</div>
                  </Link>
                );
              }

              return (
                <Link onClick={onPulse} key={item.to} to={item.to} className={`relative flex flex-col items-center gap-1.5 rounded-3xl px-1 py-2 active:scale-95 ${active ? "text-cyan-100" : "text-white/52"}`}>
                  {item.badge && <span className={`absolute -top-2 rounded-full px-2 py-0.5 text-[8px] font-black ${item.gold ? "bg-yellow-300 text-black" : "bg-pink-500 text-white"}`}>{item.badge}</span>}
                  <div className={`grid h-11 w-11 place-items-center rounded-3xl text-2xl ${active ? "bg-cyan-300/15 shadow-lg shadow-cyan-300/25" : item.gold ? "bg-yellow-300/10" : "bg-white/5"} ${item.alive ? "nav-alive" : ""}`}>{item.icon}</div>
                  <div>{item.label}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
