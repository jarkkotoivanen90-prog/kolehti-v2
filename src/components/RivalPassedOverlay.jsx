import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { onXPEvent } from "../lib/xpEvents";

export default function RivalPassedOverlay() {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const unsub = onXPEvent((e) => {
      // 🔥 tarkista oikeasti rank change
      if (!e?.beforeRank || !e?.afterRank) return;

      // 🔥 vain jos nousit paremmaksi (pienempi rank = parempi)
      if (e.afterRank < e.beforeRank && e.passedUser) {
        setEvent(e);

        setTimeout(() => {
          setEvent(null);
        }, 2500);
      }
    });

    return () => unsub?.();
  }, []);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center text-white"
        >
          <div className="bg-black/70 px-6 py-5 rounded-2xl text-center shadow-2xl backdrop-blur-md">
            <div className="text-4xl mb-2">🔥</div>
            <div className="font-black text-lg">
              Ohitit {event.passedUser}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
