import { useEffect, useState } from "react";
import { selectRival, getRivalStory } from "../lib/rivalSystem";
import { onXPEvent } from "../lib/xpEvents";

export default function RivalPanel({ ranked = [], userId }) {
  const [snapshot, setSnapshot] = useState(() =>
    selectRival({ ranked, userId })
  );

  // 🔥 päivitä kun props muuttuu
  useEffect(() => {
    setSnapshot(selectRival({ ranked, userId }));
  }, [ranked, userId]);

  // 🔥 REAALIAIKAINEN UPDATE XP EVENTISTÄ
  useEffect(() => {
    const unsub = onXPEvent(() => {
      setSnapshot(selectRival({ ranked, userId }));
    });

    return () => unsub?.();
  }, [ranked, userId]);

  if (!snapshot) return null;

  return (
    <div className="rounded-[28px] border border-cyan-200/20 bg-[#041226]/70 p-4 text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase text-cyan-200/70">
            Rival
          </div>
          <div className="text-lg font-black">
            {snapshot.title}
          </div>
        </div>

        <div className="text-sm font-black text-cyan-200">
          #{snapshot.rivalRank}
        </div>
      </div>

      {/* MESSAGE */}
      <div className="mt-3 text-sm text-white/70">
        {snapshot.message}
      </div>

      {/* STORY */}
      <div className="mt-3 text-xs text-cyan-200/60">
        {getRivalStory(snapshot)}
      </div>

      {/* STATS */}
      <div className="mt-4 flex justify-between text-xs">
        <div>Sinä: #{snapshot.userRank || "-"}</div>
        <div>Rival: #{snapshot.rivalRank}</div>
        <div>Ero: {Math.round(snapshot.gap)}</div>
      </div>

      {/* 🔥 VISUAL PRESSURE BAR */}
      <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-cyan-400 transition-all duration-500"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, 100 - snapshot.gap)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}
