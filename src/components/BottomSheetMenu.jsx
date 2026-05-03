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
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 18, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+102px)] mx-auto max-h-[76dvh] max-w-md overflow-y-auto rounded-[28px] border border-white/12 bg-[#020611]/72 px-3 pb-3 shadow-2xl shadow-black/30 backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition active:scale-[0.99] ${active ? "bg-cyan-300 text-[#061126]" : "border border-white/10 bg-white/[.065] text-white/80"}`}
              >
                <span>{item.label}</span>
                <span className={active ? "text-[#061126]/55" : "text-white/40"}>›</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-between rounded-2xl bg-pink-500/85 px-4 py-3 text-left text-sm font-black text-white transition active:scale-[0.99]"
          >
            <span>Kirjaudu ulos</span>
            <span className="text-white/50">›</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
