import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function XPOverlay() {
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    return onXPEvent((event) => {
      setMsg(`+${event.amount} XP`);
      setTimeout(() => setMsg(null), 1100);
    });
  }, []);

  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="fixed left-1/2 top-24 z-[999] -translate-x-1/2 rounded-full border border-cyan-300/50 bg-[rgba(14,165,255,0.34)] px-5 py-3 text-lg font-black text-white shadow-2xl shadow-cyan-500/25"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
