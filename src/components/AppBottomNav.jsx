import { Link, useLocation } from "react-router-dom";
import { haptic } from "../lib/effects";

export default function AppBottomNav({ hidden = false, onPulse }) {
  const location = useLocation();
  const items = [
    { to: "/", icon: "⌂", label: "Koti" },
    { to: "/feed", icon: "🔥", label: "Feed" },
    { to: "/new", icon: "+", label: "Uusi", fab: true },
    { to: "/pots", icon: "🏆", label: "Potit" },
    { to: "/profile", icon: "●", label: "Profiili" },
  ];

  function pulse(type = "tap") {
    haptic(type);
    onPulse?.();
  }

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-md px-5 pb-[max(14px,env(safe-area-inset-bottom))] text-white transition-transform duration-300 ${hidden ? "translate-y-[120%]" : "translate-y-0"}`}>
      <div className="kolehti-bottom-shell relative rounded-[30px] px-4 pb-4 pt-3">
        <div className="grid grid-cols-5 items-end text-center text-[11px] font-black">
          {items.map((item) => {
            const active = location.pathname === item.to;

            if (item.fab) {
              return (
                <Link key={item.to} to={item.to} onClick={() => pulse("heavy")} className="-mt-10 flex flex-col items-center">
                  <div className="grid h-[78px] w-[78px] place-items-center rounded-full border-[6px] border-[#061126] bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-700 text-[54px] font-black shadow-lg">
                    +
                  </div>
                  <div className="mt-1">{item.label}</div>
                </Link>
              );
            }

            return (
              <Link key={item.to} to={item.to} onClick={() => pulse()} className={`flex flex-col items-center gap-1 ${active ? "text-cyan-200" : "text-white/55"}`}>
                <div className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? "bg-cyan-300/15" : "bg-white/5"}`}>
                  {item.icon}
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
