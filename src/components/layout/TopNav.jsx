import { NavLink } from "react-router-dom";

const items = [
  ["/", "Koti"],
  ["/feed", "Feed"],
  ["/vote", "Äänestä"],
  ["/new", "Uusi"],
  ["/profile", "Profiili"],
  ["/results", "Tulokset"],
];

export default function TopNav() {
  return (
    <div className="hidden xl:flex justify-center mt-4">
      <div className="flex gap-3 bg-white/10 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
        {items.map(([to, label]) => (
          <NavLink key={to} to={to} className={({isActive}) => `rounded-xl px-4 py-2 font-semibold ${isActive ? "bg-white text-black" : "text-white/85 hover:bg-white/10"}`}>
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
