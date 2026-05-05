import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function LevelUpModal() {
  const [event, setEvent] = useState(null);
  const cooldownRef = useRef(0);

  useEffect(() => {
    return onXPEvent((event) => {
      const now = Date.now();

      if (now - cooldownRef.current < 3500) return;

      if (event?.levelAfter && event.levelAfter !== event.levelBefore) {
        setEvent(event);
        cooldownRef.current = now;

        setTimeout(() => {
          setEvent(null);
        }, 2700);
      }
    });
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            className="fixed inset-0 z-[998] bg-cyan-400/25"
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] grid place-items-center bg-black/45 px-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.72, y: 32, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -12, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 17 }}
              className="w-full max-w-xs rounded-[34px] border border-cyan-200/30 bg-gradient-to-br from-cyan-400/25 via-blue-500/20 to-black/75 p-7 text-center text-white shadow-[0_0_45px_rgba(14,165,255,.45)] backdrop-blur-xl"
            >
              <div className="text-6xl">⚡</div>

              <div className="mt-4 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/80">
                Level up
              </div>

              <div className="mt-2 text-6xl font-black leading-none">
                {event.levelAfter}
              </div>

              <div className="mt-3 text-sm font-bold text-white/70">
                Uusi taso avattu.
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
