import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";
import { getMyTarget } from "../lib/targetSystem";

export default function TargetOverlay() {
  const [target, setTarget] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onXPEvent(async (e) => {
      // 🚫 ei turhaan joka eventillä
      if (!e?.amount) return;

      try {
        const next = await getMyTarget();
        if (!next) return;

        setTarget(next);
        setVisible(true);

        setTimeout(() => {
          setVisible(false);
        }, 2000);
      } catch (err) {
        console.warn("TargetOverlay error:", err);
      }
    });
  }, []);

  if (!target) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-24 right-4 z-[999]"
        >
          <div className="rounded-2xl bg-cyan-500/20 backdrop-blur-lg px-4 py-3 text-white shadow-xl border border-cyan-300/30">
            <div className="text-sm font-bold">
              🎯 {target.title}
            </div>
            <div className="text-xs text-white/80">
              {Math.round(target.diff)} XP jäljellä
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
