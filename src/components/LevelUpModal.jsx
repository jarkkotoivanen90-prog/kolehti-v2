import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function LevelUpModal() {
  const [event, setEvent] = useState(null);
  const cooldown = useRef(0);

  useEffect(() => {
    return onXPEvent((e) => {
      const now = Date.now();
      if (now - cooldown.current < 3800) return;

      if (e?.levelAfter && e.levelAfter !== e.levelBefore) {
        setEvent(e);
        cooldown.current = now;

        setTimeout(() => setEvent(null), 2400);
      }
    });
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] grid place-items-center bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.88, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: -8 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="w-[86%] max-w-xs rounded-2xl border border-white/10 bg-black/70 p-5 text-center text-white shadow-xl backdrop-blur-lg"
          >
            <div className="text-3xl">⚡</div>
            <div className="mt-2 text-sm font-semibold tracking-tight">
              Level {event.levelAfter}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
