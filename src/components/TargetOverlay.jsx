import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyTarget } from "../lib/rankTargets";
import { playTarget } from "../lib/sounds";

export default function TargetOverlay() {
  const [target, setTarget] = useState(null);
  const lastDiffRef = useRef(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
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

  const progress =
    target.targetXp > 0
      ? Math.max(0, Math.min(100, (target.myXp / target.targetXp) * 100))
      : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-5 left-1/2 z-[998] w-[90%] max-w-md -translate-x-1/2 rounded-2xl border border-cyan-300/25 bg-black/50 px-4 py-3 text-white shadow-2xl shadow-cyan-500/10 backdrop-blur-md"
      >
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/65">
          🎯 Ohita seuraavaksi
        </div>

        <div className="mt-1 flex items-center justify-between">
          <div className="font-black">{target.targetName}</div>
          <div className="text-sm font-black text-cyan-200">
            {target.diff} XP
          </div>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
