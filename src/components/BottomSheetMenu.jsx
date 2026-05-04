import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

const items = [
  { label: "Etusivu", to: "/" },
  { label: "Feed", to: "/feed" },
  { label: "Uusi", to: "/new" },
  { label: "Porukat", to: "/groups" },
  { label: "Potit", to: "/pots" },
  { label: "Top-lista", to: "/leaderboard" },
  { label: "Profiili", to: "/profile" },
];

export default function BottomSheetMenu({ open, onClose, onLogout }) {
  const location = useLocation();
  if (!open) return null;

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/42 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+102px)] mx-auto max-h-[76dvh] max-w-md overflow-y-auto rounded-[28px] border border-white/12 bg-[#020611]/76 px-3 pb-3 shadow-2xl shadow-black/30 backdrop-blur-xl will-change-transform [scrollbar-width:none] md:backdrop-blur-2xl [&::-webkit-scrollbar]:hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-2 pt-3">
          {items.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={`${item.label}-${item.to}`}
                to={item.to}
                onClick={onClose}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition-all duration-200 ease-out active:scale-[0.97] ${active ? "bg-cyan-300 text-[#061126] shadow-[0_0_18px_rgba(34,211,238,0.35)]" : "border border-white/10 bg-white/[.065] text-white/80 active:shadow-lg active:shadow-cyan-300/20"}`}
              >
                <span>{item.label}</span>
                <span className={active ? "text-[#061126]/55" : "text-white/40"}>›</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-between rounded-2xl bg-pink-500/85 px-4 py-3 text-left text-sm font-black text-white transition-all duration-200 ease-out active:scale-[0.97] active:shadow-lg active:shadow-pink-400/20"
          >
            <span>Kirjaudu ulos</span>
            <span className="text-white/50">›</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
