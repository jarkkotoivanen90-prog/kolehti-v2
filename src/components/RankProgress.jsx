import { useEffect, useMemo, useState } from "react";
import { onXPEvent } from "../lib/xpEvents";

export default function RankProgress() {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return onXPEvent((e) => {
      if (!e?.amount) return;

      setXp((prev) => Math.max(0, prev + Number(e.amount || 0)));

      if (e.levelAfter) {
        setLevel(e.levelAfter);
      }

      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 3500);
    });
  }, []);

  const nextLevelXp = useMemo(() => {
    return Math.max(100, level * 100);
  }, [level]);

  const progress = Math.max(
    0,
    Math.min(100, (xp / nextLevelXp) * 100)
  );

  if (!visible) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[998] w-[90%] max-w-md -translate-x-1/2">
      <div className="rounded-2xl border border-cyan-300/25 bg-black/45 p-3 text-white shadow-xl backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between text-xs font-black">
          <span>Level {level}</span>
          <span className="text-cyan-200">
            {xp} / {nextLevelXp} XP
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
