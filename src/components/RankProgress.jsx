import { useEffect, useRef, useState } from "react";
import { onXPEvent } from "../lib/xpEvents";

export default function RankProgress() {
  const [xp, setXp] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    return onXPEvent((e) => {
      if (!e?.amount) return;

      setXp((prev) => prev + e.amount);
      setVisible(true);

      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
      }, 3200);
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 z-[998] -translate-x-1/2">
      <div className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-semibold text-white/90 shadow-md backdrop-blur-md">
        {xp} XP
      </div>
    </div>
  );
}
