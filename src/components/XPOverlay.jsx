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

      if (now - lastEventTime.current < 900) {
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
      }, 1400);
    });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1.15, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="fixed bottom-32 left-1/2 z-[999] -translate-x-1/2 rounded-full border border-cyan-300/40 bg-[rgba(14,165,255,0.25)] px-6 py-3 text-lg font-black text-white shadow-2xl backdrop-blur-md"
        >
          <span>+{xp} XP</span>

          {combo > 1 && (
            <span className="ml-3 text-yellow-300 animate-pulse">
              🔥 x{combo}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
