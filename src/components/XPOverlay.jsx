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

      // 🔥 combo window 900ms
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
          initial={{ y: 30, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-28 left-1/2 z-[999] -translate-x-1/2 rounded-full bg-black/70 px-5 py-2 text-sm font-black text-white backdrop-blur-md"
        >
          +{xp} XP {combo > 1 && <span className="text-yellow-300">🔥 x{combo}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
