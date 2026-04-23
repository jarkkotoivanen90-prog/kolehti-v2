import { AnimatePresence, motion } from "framer-motion";

const styles = {
  success: "border-emerald-300/20 bg-emerald-400/15 text-emerald-100",
  error: "border-rose-300/20 bg-rose-400/15 text-rose-100",
  info: "border-cyan-300/20 bg-cyan-400/15 text-cyan-100",
};

export default function NotificationStack({ notifications = [], onClose }) {
  return (
    <div className="fixed right-4 top-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-3">
      <AnimatePresence>
        {notifications.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className={`rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] ${styles[item.type] || styles.info}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold">{item.message}</div>
              <button onClick={() => onClose?.(item.id)} className="text-xs text-white/70 hover:text-white">✕</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
