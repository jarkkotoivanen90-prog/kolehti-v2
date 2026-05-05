import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function XPOverlay() {
  const [xp, setXP] = useState(null);

  useEffect(() => {
    return onXPEvent((event) => {
      setXP(event.amount);

      setTimeout(() => setXP(null), 1200);
    });
  }, []);

  return (
    <AnimatePresence>
      {xp && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[999]
          px-5 py-3 rounded-full bg-cyan-500 text-white font-black shadow-xl"
        >
          +{xp} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}
