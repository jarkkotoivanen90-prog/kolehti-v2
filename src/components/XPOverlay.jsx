import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function XPOverlay() {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    return onXPEvent((e) => {
      if (!e?.amount) return;

      setEvent(e);

      setTimeout(() => {
        setEvent(null);
      }, 1200);
    });
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-32 left-1/2 z-[999] -translate-x-1/2 rounded-full border border-cyan-300/40 bg-[rgba(14,165,255,0.28)] px-5 py-3 text-base font-black text-white shadow-xl backdrop-blur-md"
        >
          +{event.amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}
