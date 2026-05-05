import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function RivalPassedOverlay() {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const unsub = onXPEvent((e) => {
      if (!e?.beforeRank || !e?.afterRank) return;

      if (e.afterRank < e.beforeRank && e.passedUser) {
        setEvent(e);
        setTimeout(() => setEvent(null), 2200);
      }
    });

    return () => unsub?.();
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1.05, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[1000] grid place-items-center text-white"
        >
          <div className="rounded-2xl border border-white/10 bg-black/70 px-5 py-4 text-center shadow-xl backdrop-blur-lg">
            <div className="text-3xl">🔥</div>
            <div className="mt-1 text-sm font-semibold">
              Ohitit {event.passedUser}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
