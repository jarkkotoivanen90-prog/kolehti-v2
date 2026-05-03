import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const items = [
  { label: "Profiili", to: "/profile" },
  { label: "Omat pisteet", to: "/leaderboard" },
  { label: "Asetukset", to: "/profile" },
];

export default function BottomSheetMenu({ open, onClose, onLogout }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-white/10 bg-[#050816]/95 px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 text-white shadow-2xl shadow-black/70"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-4 text-base font-black transition active:scale-[0.99]"
            >
              <span>{item.label}</span>
              <span className="text-white/40">›</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-between rounded-2xl border border-red-200/12 bg-red-500/10 px-4 py-4 text-left text-base font-black text-red-100 transition active:scale-[0.99]"
          >
            <span>Kirjaudu ulos</span>
            <span className="text-red-100/45">›</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
