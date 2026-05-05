import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMyTarget } from "../../lib/rankTargets";
import { playTarget } from "../../lib/soundEngine";

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
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  async function load() {
    try {
      const next = await getMyTarget();

      if (!next) return;

      // 🔊 soita ääni vain kun oikeasti edistyt
      if (
        lastDiffRef.current !== null &&
        next.diff < lastDiffRef.current
      ) {
        playTarget();
      }

      lastDiffRef.current = next.diff;
      setTarget(next);

      // 👇 näytä hint hetkeksi
      setVisible(true);

      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, 3500);
    } catch (e) {
      console.warn("FeedTargetHint error:", e);
    }
  }

  if (!target) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none fixed left-1/2 top-20 z-[998] -translate-x-1/2"
        >
          <div className="rounded-full border border-cyan-300/30 bg-[rgba(14,165,255,0.18)] px-4 py-2 text-center text-sm font-black text-white shadow-xl shadow-cyan-500/10 backdrop-blur-md">
            
            <div className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/70">
              🎯 Seuraava ohitus
            </div>

            <div className="mt-1">
              {target.targetName || "Pelaaja"} ·{" "}
              <span className="text-cyan-200">
                {target.diff ?? 0} XP
              </span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
