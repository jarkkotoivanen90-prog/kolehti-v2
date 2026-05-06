import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";
import { getMyTarget } from "../lib/targetSystem";

export default function FeedTargetHint() {
  const [target, setTarget] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer = null;

    const unsub = onXPEvent(async (event) => {
      if (!event?.amount) return;

      try {
        const next = await getMyTarget();
        if (!next) return;

        setTarget(next);
        setVisible(true);

        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          setVisible(false);
        }, 2200);
      } catch (err) {
        console.warn("FeedTargetHint failed:", err);
      }
    });

    return () => {
      clearTimeout(hideTimer);
      unsub?.();
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && target && (
        <motion.div
          initial={{ y: -24, opacity: 0, scale: 0.94 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="pointer-events-none fixed left-1/2 top-4 z-[998] -translate-x-1/2 rounded-full border border-cyan-300/30 bg-black/55 px-4 py-2 text-xs font-black text-white shadow-xl backdrop-blur-md"
        >
          🎯 {target.title} · {Math.round(target.diff)} XP jäljellä
        </motion.div>
      )}
    </AnimatePresence>
  );
}
