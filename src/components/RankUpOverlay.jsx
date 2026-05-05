import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";
import { haptic } from "../lib/effects";

export default function RankUpOverlay() {
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    return onXPEvent((event) => {
      // LEVEL UP
      if (
        event.levelAfter &&
        event.levelBefore &&
        event.levelAfter > event.levelBefore
      ) {
        setMsg(`⚡ Level ${event.levelAfter}!`);
        haptic?.("success");
        setTimeout(() => setMsg(null), 1800);
        return;
      }

      // RANK UP
      if (
        event.beforeRank &&
        event.afterRank &&
        event.afterRank < event.beforeRank
      ) {
        const text = event.passedUser
          ? `🚀 Ohitit ${event.passedUser}`
          : `🚀 #${event.beforeRank} → #${event.afterRank}`;

        setMsg(text);
        haptic?.("success");
        setTimeout(() => setMsg(null), 1800);
        return;
      }

      // STREAK
      if (event.streak >= 3) {
        setMsg(`🔥 ${event.streak} päivän streak`);
        setTimeout(() => setMsg(null), 1500);
      }
    });
  }, []);

  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.84 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260 }}
          className="fixed bottom-36 left-1/2 z-[999] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3 text-lg font-black text-white shadow-2xl shadow-cyan-500/30"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
