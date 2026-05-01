import { selectRival, getRivalStory } from "../lib/rivalSystem";

export default function RivalPanel({ ranked = [], userId }) {
  const snapshot = selectRival({ ranked, userId });

  if (!snapshot) return null;

  return (
    <div className="rounded-[28px] border border-cyan-200/20 bg-[#041226]/70 p-4 text-white">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase text-cyan-200/70">Rival</div>
          <div className="text-lg font-black">{snapshot.title}</div>
        </div>
        <div className="text-sm font-black text-cyan-200">#{snapshot.rivalRank}</div>
      </div>

      <div className="mt-3 text-sm text-white/70">
        {snapshot.message}
      </div>

      <div className="mt-3 text-xs text-cyan-200/60">
        {getRivalStory(snapshot)}
      </div>

      <div className="mt-4 flex justify-between text-xs">
        <div>Sinä: #{snapshot.userRank || "-"}</div>
        <div>Rival: #{snapshot.rivalRank}</div>
        <div>Ero: {Math.round(snapshot.gap)}</div>
      </div>
    </div>
  );
}
