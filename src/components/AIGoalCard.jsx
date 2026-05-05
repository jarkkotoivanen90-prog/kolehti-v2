import { getAIGoal } from "../lib/aiGoals";

export default function AIGoalCard({ text, xp = 0, streak = 0 }) {
  const goal = getAIGoal({ text, xp, streak });

  return (
    <div className="mt-4 rounded-2xl border border-cyan-300/24 bg-[rgba(14,165,255,0.10)] p-4 text-white">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/65">
        AI tavoite
      </div>

      <div className="mt-1 text-lg font-black">{goal.title}</div>
      <div className="mt-1 text-sm font-bold text-white/70">{goal.message}</div>

      <div className="mt-3 inline-flex rounded-full border border-cyan-300/35 bg-cyan-400/15 px-3 py-1 text-xs font-black text-cyan-100">
        +{goal.reward} XP
      </div>
    </div>
  );
}
