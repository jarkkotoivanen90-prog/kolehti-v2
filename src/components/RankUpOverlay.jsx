import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function RankUpOverlay() {
  const [event, setEvent] = useState(null);
  const cooldown = useRef(0);

  useEffect(() => {
    return onXPEvent((e) => {
      const now = Date.now();
      if (now - cooldown.current < 2800) return;

      if (e?.beforeRank && e?.afterRank && e.afterRank < e.beforeRank) {
        setEvent(e);
        cooldown.current = now;

        setTimeout(() => setEvent(null), 2200);
      }
    });
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ y: -36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -36, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-20 left-1/2 z-[999] -translate-x-1/2 rounded-full border border-white/10 bg-black/65 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md"
        >
          🏆 #{event.afterRank}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
