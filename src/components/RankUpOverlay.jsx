import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function RankUpOverlay() {
  const [event, setEvent] = useState(null);
  const cooldown = useRef(0);

  useEffect(() => {
    return onXPEvent((e) => {
      const now = Date.now();

      if (now - cooldown.current < 3000) return;

      if (e?.beforeRank && e?.afterRank && e.afterRank < e.beforeRank) {
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
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 z-[999] -translate-x-1/2 rounded-xl bg-black/80 px-4 py-3 text-white backdrop-blur-md"
        >
          🏆 #{event.afterRank}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
