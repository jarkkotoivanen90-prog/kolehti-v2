import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents.js";

export default function XPOverlay() {
  const [xp, setXP] = useState(null);

  useEffect(() => {
    const unsub = onXPEvent((value) => {
      setXP(value);

      setTimeout(() => {
        setXP(null);
      }, 1500);
    });

    return () => unsub?.();
  }, []);

  return (
    <AnimatePresence>
      {xp !== null && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[999] text-lg font-black text-green-400"
        >
          +{xp} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}
