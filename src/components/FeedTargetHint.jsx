import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyTarget } from "../lib/rankTargets";
import { playTarget } from "../lib/sounds";

export default function FeedTargetHint() {
  const [target, setTarget] = useState(null);
  const lastDiffRef = useRef(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const next = await getMyTarget();

    if (
      next &&
      lastDiffRef.current !== null &&
      next.diff < lastDiffRef.current
    ) {
      playTarget();
    }

    lastDiffRef.current = next?.diff ?? null;
    setTarget(next);
  }

  if (!target) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -34, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -34, opacity: 0 }}
        className="fixed left-1/2 top-4 z-[998] -translate-x-1/2 rounded-full border border-cyan-300/25 bg-black/50 px-4 py-2 text-sm font-black text-white shadow-xl shadow-cyan-500/10 backdrop-blur-md"
      >
        🎯 Ohita {target.targetName} · {target.diff} XP
      </motion.div>
    </AnimatePresence>
  );
}
