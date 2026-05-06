import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function XPOverlay() {
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(1);
  const [visible, setVisible] = useState(false);

  const lastEventTime = useRef(0);
  const hideTimerRef = useRef(null);

  // 🔥 estää saman eventin spammin
  const cooldownRef = useRef(false);

  useEffect(() => {
    return onXPEvent((event) => {
      if (!event?.amount) return;

      // 🔥 anti flicker
      if (cooldownRef.current) return;

      cooldownRef.current = true;

      setTimeout(() => {
        cooldownRef.current = false;
      }, 500);

      const amount = Number(event.amount || 0);
      const now = Date.now();

      if (now - lastEventTime.current < 850) {
        setCombo((current) => current + 1);
        setXp((current) => current + amount);
      } else {
        setCombo(1);
        setXp(amount);
      }

      lastEventTime.current = now;

      setVisible(true);

      clearTimeout(hideTimerRef.current);

      hideTimerRef.current = setTimeout(() => {
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
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1.12, opacity: 1, y: 0 }}
          exit={{ scale: 0.82, opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="fixed bottom-32 left-1/2 z-[999] -translate-x-1/2"
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 0.25 }}
            className="rounded-full border border-cyan-300/30 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 px-6 py-4 text-xl font-black text-white shadow-[0_0_35px_rgba(14,165,255,.55)] backdrop-blur-md"
          >
            +{xp} XP

            {combo > 1 && (
              <span className="ml-3 text-yellow-300">
                🔥 x{combo}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
