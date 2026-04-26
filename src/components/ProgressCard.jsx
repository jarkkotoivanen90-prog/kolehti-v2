import {
  getNextLevelXP,
  getXPProgress,
} from "../lib/progression";

export default function ProgressCard({ profile }) {
  const xp = Number(profile?.xp || 0);
  const level = Number(profile?.level || 1);
  const nextXP = getNextLevelXP(level);
  const progress = getXPProgress(xp, level);

  return (
    <section className="rounded-[34px] border border-cyan-300/20 bg-cyan-500/10 p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-cyan-200">
            Progression
          </div>
          <h2 className="mt-1 text-3xl font-black">
            LVL {level}
          </h2>
          <p className="mt-1 text-sm font-bold text-white/60">
            {level >= 10 ? "Maksimitaso saavutettu" : `${xp} / ${nextXP} XP`}
          </p>
        </div>

        <div className="grid h-20 w-20 place-items-center rounded-[26px] bg-cyan-500 text-4xl font-black shadow-xl shadow-cyan-500/25">
          ⚡
        </div>
      </div>

      <div className="mt-5 h-4 overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-pink-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black text-white/70">
        <div className="rounded-2xl bg-white/10 p-3">+5 XP<br />Ääni</div>
        <div className="rounded-2xl bg-white/10 p-3">+10 XP<br />Postaus</div>
        <div className="rounded-2xl bg-white/10 p-3">+50 XP<br />TOP 3</div>
      </div>
    </section>
  );
}
