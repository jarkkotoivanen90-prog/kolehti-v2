import { buildEgoSnapshot } from "../lib/streakSystem";

export default function EgoPanel() {
  const ego = buildEgoSnapshot();

  return (
    <div className="rounded-[28px] border border-cyan-200/20 bg-[#041226]/70 p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase text-cyan-200/70">Ego level</div>
          <div className="text-xl font-black">{ego.ego.title}</div>
        </div>
        <div className="text-2xl font-black text-cyan-200">Lv {ego.ego.level}</div>
      </div>

      <div className="mt-3 text-sm text-white/70">
        {ego.message}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-white/5 rounded-xl p-2">
          <div className="font-black">{ego.currentStreak}</div>
          <div className="text-white/50">putki</div>
        </div>
        <div className="bg-white/5 rounded-xl p-2">
          <div className="font-black">{ego.bestStreak}</div>
          <div className="text-white/50">paras</div>
        </div>
        <div className="bg-white/5 rounded-xl p-2">
          <div className="font-black">{ego.winRate}%</div>
          <div className="text-white/50">winrate</div>
        </div>
      </div>
    </div>
  );
}
