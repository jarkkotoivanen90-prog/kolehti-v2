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
        initial={{ y: "100%", opacity: 0.96 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="absolute bottom-0 left-1/2 max-h-[82dvh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-[32px] border border-white/12 bg-[#020611]/88 px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 text-white shadow-2xl shadow-black/70 backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/22" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,238,255,.16),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/55 to-transparent" />

        <div className="relative mb-4 px-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/55">Sivut</div>
        <div className="relative space-y-2">
          {items.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={`${item.label}-${item.to}`}
                to={item.to}
                onClick={onClose}
                className={`flex items-center justify-between rounded-2xl px-4 py-4 text-base font-black transition active:scale-[0.99] ${active ? "bg-cyan-300 text-[#061126] shadow-lg shadow-cyan-300/20" : "border border-white/10 bg-white/[.065] text-white/84"}`}
              >
                <span>{item.label}</span>
                <span className={active ? "text-[#061126]/55" : "text-white/40"}>›</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-between rounded-2xl bg-pink-500/85 px-4 py-4 text-left text-base font-black text-white transition active:scale-[0.99]"
          >
            <span>Kirjaudu ulos</span>
            <span className="text-white/50">›</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
