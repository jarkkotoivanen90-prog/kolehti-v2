import { useEffect, useRef, useState } from "react";
import { onXPEvent } from "../lib/xpEvents";

export default function RankProgress() {
  const [displayXp, setDisplayXp] = useState(0);
  const realXpRef = useRef(0);

  const [level, setLevel] = useState(1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onXPEvent((e) => {
      if (!e?.amount) return;

      realXpRef.current += e.amount;

      if (e.levelAfter) {
        setLevel(e.levelAfter);
      }

      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 4000);
    });
  }, []);

  // 🔥 smooth interpolation
  useEffect(() => {
    let raf;

    const animate = () => {
      setDisplayXp((prev) => {
        const diff = realXpRef.current - prev;
        if (Math.abs(diff) < 0.5) return realXpRef.current;
        return prev + diff * 0.2;
      });

      raf = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  const nextLevelXp = Math.max(100, level * 100);
  const progress = Math.min(100, (displayXp / nextLevelXp) * 100);

  if (!visible) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[998] w-[90%] max-w-md -translate-x-1/2">
      <div className="rounded-2xl border border-cyan-300/25 bg-black/45 p-3 text-white shadow-xl backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between text-xs font-black">
          <span>Level {level}</span>
          <span className="text-cyan-200">
            {Math.round(displayXp)} / {nextLevelXp} XP
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-cyan-400 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
