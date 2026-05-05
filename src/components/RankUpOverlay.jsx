import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function RankUpOverlay() {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    return onXPEvent((e) => {
      if (!e?.didRankUp) return;

      setEvent(e);

      setTimeout(() => {
        setEvent(null);
      }, 2600);
    });
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ y: -50, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 z-[999] -translate-x-1/2 rounded-2xl border border-yellow-300/40 bg-[rgba(255,215,0,0.22)] px-6 py-4 text-center text-white shadow-2xl backdrop-blur-md"
        >
          <div className="text-2xl">🏆</div>
          <div className="mt-1 text-sm font-black uppercase tracking-[0.14em]">
            Rank nousi
          </div>
          <div className="mt-1 text-xl font-black">
            #{event.beforeRank} → #{event.afterRank}
          </div>

          {event.passedUser && (
            <div className="mt-1 text-xs font-bold text-white/75">
              Ohitit käyttäjän {event.passedUser}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
