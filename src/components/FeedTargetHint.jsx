import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ OIKEAT POLUT
import { getMyTarget } from "../lib/rankTargets.js";
import { playTarget } from "../lib/soundEngine.js";

export default function FeedTargetHint() {
  const [target, setTarget] = useState(null);
  const [visible, setVisible] = useState(false);

  const lastDiffRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    load();

    const interval = setInterval(load, 6000);

    return () => {
      clearInterval(interval);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  function load() {
    try {
      const next = getMyTarget();

      if (!next) return;

      // 🔊 Soita ääni vain kun oikeasti edistyt
      if (
        lastDiffRef.current !== null &&
        next.diff < lastDiffRef.current
      ) {
        playTarget();
      }

      lastDiffRef.current = next.diff;

      setTarget(next);
      setVisible(true);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, 2500);
    } catch (e) {
      console.error("FeedTargetHint error:", e);
    }
  }

  return (
    <AnimatePresence>
      {visible && target && (
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 left-1/2 z-[999] -translate-x-1/2 rounded-full border border-cyan-300/40 bg-[rgba(14,165,255,0.22)] px-5 py-3 text-sm font-black text-white shadow-xl backdrop-blur-md"
        >
          🎯 {target.targetName} · {target.diff} XP jäljellä
        </motion.div>
      )}
    </AnimatePresence>
  );
}
