import { NavLink } from "react-router-dom";

const items = [
  ["/", "🏠", "Koti"],
  ["/feed", "📰", "Feed"],
  ["/vote", "🗳️", "Äänestä"],
  ["/new", "➕", "Uusi"],
  ["/profile", "👤", "Profiili"],
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-20 w-[95%] -translate-x-1/2 rounded-[28px] border border-white/12 bg-white/10 px-3 py-3 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] xl:hidden">
      <div className="grid grid-cols-5 gap-2">
        {items.map(([to, icon, label]) => (
          <NavLink key={to} to={to} className={({isActive}) => `rounded-[20px] px-3 py-3 text-center ${isActive ? "bg-white/12" : "hover:bg-white/10"}`}>
            <div className="text-xl">{icon}</div>
            <div className="mt-1 text-[11px] font-bold text-white/85">{label}</div>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
