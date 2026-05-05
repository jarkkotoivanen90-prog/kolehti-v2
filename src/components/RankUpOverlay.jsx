import { useEffect, useState } from "react";
import { onXPEvent } from "../lib/xpEvents";
import { motion, AnimatePresence } from "framer-motion";

export default function RankUpOverlay() {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    return onXPEvent((e) => {
      // näytetään vain jos rank parani
      if (
        e.beforeRank &&
        e.afterRank &&
        e.afterRank < e.beforeRank
      ) {
        setEvent(e);

        setTimeout(() => {
          setEvent(null);
        }, 3000);
      }
    });
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ y: -60, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 z-[999] -translate-x-1/2 rounded-xl border border-yellow-300/40 bg-[rgba(255,215,0,0.2)] px-6 py-4 text-sm font-black text-white shadow-xl backdrop-blur-md"
        >
          🏆 Rank nousi #{event.afterRank}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
