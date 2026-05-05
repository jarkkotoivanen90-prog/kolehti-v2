import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function XPOverlay() {
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(1);
  const [visible, setVisible] = useState(false);

  const lastEventTime = useRef(0);
  const hideTimer = useRef(null);

  useEffect(() => {
    return onXPEvent((e) => {
      if (!e?.amount) return;

      const now = Date.now();

      // combo window ~850ms
      if (now - lastEventTime.current < 850) {
        setCombo((c) => c + 1);
        setXp((x) => x + e.amount);
      } else {
        setCombo(1);
        setXp(e.amount);
      }

      lastEventTime.current = now;

      setVisible(true);

      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setXp(0);
        setCombo(1);
      }, 1300);
    });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 24, opacity: 0, scale: 0.94 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-28 left-1/2 z-[999] -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md"
        >
          <span className="tracking-tight">
            +{xp} XP
          </span>
          {combo > 1 && (
            <span className="ml-2 text-yellow-300/90">🔥 x{combo}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
