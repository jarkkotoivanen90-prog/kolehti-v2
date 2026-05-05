import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function LevelUpModal() {
  const [event, setEvent] = useState(null);
  const cooldown = useRef(0);

  useEffect(() => {
    return onXPEvent((e) => {
      const now = Date.now();

      if (now - cooldown.current < 4000) return;

      if (e?.levelAfter && e.levelAfter !== e.levelBefore) {
        setEvent(e);
        cooldown.current = now;

        setTimeout(() => setEvent(null), 2600);
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
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl bg-black px-6 py-5 text-center text-white"
          >
            <div className="text-3xl">⚡</div>
            <div className="mt-2 font-black text-xl">Level {event.levelAfter}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
