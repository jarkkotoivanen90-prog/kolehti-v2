import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function XPOverlay() {
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(1);
  const [visible, setVisible] = useState(false);

  const lastEventTime = useRef(0);
  const hideTimer = useRef(null);

  // 🔥 tärkein: estää spammin
  const lastHandledId = useRef(null);

  useEffect(() => {
    return onXPEvent((e) => {
      if (!e?.amount) return;

      // 🧠 estä duplicate eventit
      const eventId = `${e.type}-${e.refId}-${e.amount}-${Date.now()}`;

      if (lastHandledId.current === eventId) return;
      lastHandledId.current = eventId;

      const now = Date.now();

      // 🔥 jos eventtejä tulee liian nopeasti → ignore
      if (now - lastEventTime.current < 120) return;

      if (now - lastEventTime.current < 800) {
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
      }, 1200);
    });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 30 }}
          animate={{ scale: 1.1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed bottom-28 left-1/2 z-[999] -translate-x-1/2"
        >
          <div className="rounded-full bg-black/70 px-5 py-3 text-white font-black text-lg shadow-xl backdrop-blur-md">
            +{xp} XP
            {combo > 1 && (
              <span className="ml-2 text-yellow-300">
                🔥 x{combo}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
