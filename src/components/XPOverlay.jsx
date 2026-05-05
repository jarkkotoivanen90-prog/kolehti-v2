import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function XPOverlay() {
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(1);
  const [visible, setVisible] = useState(false);

  const timerRef = useRef(null);
  const comboTimerRef = useRef(null);

  useEffect(() => {
    return onXPEvent((e) => {
      if (!e?.amount) return;

      // 🔥 combo jos nopeasti peräkkäin
      setCombo((prev) => {
        if (comboTimerRef.current) {
          clearTimeout(comboTimerRef.current);
          return prev + 1;
        }
        return 1;
      });

      // reset combo timeout (1.2s)
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setCombo(1);
      }, 1200);

      // ➕ lisää XP (smooth stacking)
      setXp((prev) => prev + e.amount);

      // 👁 näkyviin
      setVisible(true);

      // ⏳ hide timeout
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setXp(0);
        setCombo(1);
      }, 1600);
    });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="xp"
          initial={{ y: 40, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-28 left-1/2 z-[999] -translate-x-1/2 rounded-full border border-cyan-300/40 bg-[rgba(14,165,255,0.28)] px-6 py-3 text-lg font-black text-white shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span>+{xp} XP</span>

            {combo > 1 && (
              <motion.span
                key={combo}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-yellow-300"
              >
                🔥 x{combo}
              </motion.span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
