import { selectRival, getRivalStory, getRivalName } from "../lib/rivalSystem";

export default function LiveRivalBattle({ ranked = [], userId }) {
  const snapshot = selectRival({ ranked, userId });
  if (!snapshot) return null;

  const userScore = Number(snapshot.userEntry?.winner_score || snapshot.userEntry?.score || 0);
  const rivalScore = Number(snapshot.rival?.winner_score || snapshot.rival?.score || 0);
  const total = Math.max(1, userScore + rivalScore);
  const userPct = Math.max(8, Math.min(92, Math.round((userScore / total) * 100)));
  const rivalName = getRivalName(snapshot.rival);
  const overtake = snapshot.gap <= 80;

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-cyan-200/20 bg-[#041226]/78 p-5 text-white shadow-2xl shadow-cyan-500/10">
      <style>{`
        @keyframes battlePulse{0%,100%{opacity:.55}50%{opacity:1}}
        .battle-pulse{animation:battlePulse 1.8s ease-in-out infinite}
      `}</style>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.14),transparent_45%)]" />

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/62">Live rival battle</p>
          <h2 className="mt-1 text-2xl font-black">Sinä vs {rivalName}</h2>
        </div>
        <div className="rounded-full border border-cyan-100/10 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
          {overtake ? "OHITUS LÄHELLÄ" : snapshot.userAhead ? "JOHDAT" : "JAHTAAT"}
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-[24px] bg-white/[.055] p-4">
          <div className="text-[10px] font-black uppercase text-white/45">Sinä</div>
          <div className="mt-1 text-3xl font-black">{userScore}</div>
          <div className="mt-1 text-xs font-bold text-white/45">#{snapshot.userRank || "-"}</div>
        </div>
        <div className="rounded-[24px] bg-white/[.055] p-4">
          <div className="text-[10px] font-black uppercase text-white/45">Rival</div>
          <div className="mt-1 text-3xl font-black">{rivalScore}</div>
          <div className="mt-1 text-xs font-bold text-white/45">#{snapshot.rivalRank || "-"}</div>
        </div>
      </div>

      <div className="relative mt-5 overflow-hidden rounded-full bg-black/45 p-1">
        <div className="h-5 rounded-full bg-gradient-to-r from-cyan-200 via-sky-400 to-blue-600 transition-all duration-700" style={{ width: `${userPct}%` }} />
        <div className="absolute inset-0 grid place-items-center text-[10px] font-black uppercase tracking-wide text-white/80">
          ero {Math.round(snapshot.gap)} pts
        </div>
      </div>

      <p className="relative mt-4 text-sm font-bold leading-snug text-white/68">{snapshot.message}</p>
      <p className="relative mt-2 text-xs font-black text-cyan-100/70">{getRivalStory(snapshot)}</p>

      {overtake && (
        <div className="battle-pulse relative mt-4 rounded-[22px] border border-cyan-100/15 bg-cyan-300/10 px-4 py-3 text-xs font-black text-cyan-100">
          ⚡ Yksi vahva ääni tai parempi perustelu voi kääntää tämän taistelun.
        </div>
      )}
    </section>
  );
}
