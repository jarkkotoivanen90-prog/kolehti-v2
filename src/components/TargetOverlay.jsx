import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyTarget } from "../lib/rankTargets";

export default function TargetOverlay() {
  const [target, setTarget] = useState(null);
  const [visible, setVisible] = useState(false);

  const lastDiffRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    load();

    const interval = setInterval(load, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  async function load() {
    try {
      const next = await getMyTarget();

      if (!next) {
        setVisible(false);
        return;
      }

      const diffChanged = lastDiffRef.current !== null && next.diff !== lastDiffRef.current;
      const firstLoad = lastDiffRef.current === null;

      setTarget(next);

      if (diffChanged) {
        setVisible(true);

        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
        }, 2600);
      }

      if (firstLoad) {
        setVisible(false);
      }

      lastDiffRef.current = next.diff;
    } catch (err) {
      console.warn("TargetOverlay load failed:", err);
    }
  }

  return (
    <AnimatePresence>
      {visible && target && (
        <motion.div
          initial={{ y: 28, opacity: 0, scale: 0.94 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="fixed bottom-32 right-4 z-[998] max-w-[280px] rounded-[28px] border border-cyan-200/20 bg-[#041226]/82 px-5 py-4 text-white shadow-2xl shadow-cyan-500/20 backdrop-blur-md"
        >
          <div className="text-sm font-black leading-snug">
            🎯 {target.targetName} · {Math.max(0, Math.round(target.diff))} XP jäljellä
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
