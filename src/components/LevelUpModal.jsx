import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function LevelUpModal() {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    return onXPEvent((e) => {
      if (!e?.didLevelUp) return;

      setEvent(e);

      setTimeout(() => {
        setEvent(null);
      }, 3000);
    });
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] grid place-items-center bg-black/55 px-5 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.75, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="w-full max-w-sm rounded-[32px] border border-cyan-300/35 bg-[rgba(14,165,255,0.22)] p-7 text-center text-white shadow-2xl shadow-cyan-500/25 backdrop-blur-xl"
          >
            <div className="text-6xl">⚡</div>

            <div className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-cyan-100/80">
              Level up
            </div>

            <div className="mt-2 text-5xl font-black">
              {event.levelAfter}
            </div>

            <div className="mt-3 text-sm font-bold text-white/75">
              Nousit uudelle tasolle. Jatka samaan tahtiin.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
