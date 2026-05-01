import { useEffect } from "react";

export default function LossScreen({ userEntry, winner, race, amount = 0, onClose, onRevenge }) {
  useEffect(() => {
    try { navigator.vibrate?.([40, 30, 40]); } catch {}
  }, []);

  if (!winner) return null;

  const gap = race?.gap || 0;
  const winnerName = winner.bot ? winner.bot_name || "Pelibotti" : "Pelaaja";
  const userScore = userEntry?.winner_score || userEntry?.score || 0;

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center overflow-hidden bg-[#02040c]/94 px-5 text-white backdrop-blur-2xl">
      <style>{`
        @keyframes revengeGlow{0%,100%{opacity:.35;transform:scale(1)}50%{opacity:.85;transform:scale(1.08)}}
        @keyframes cardIn{0%{transform:translateY(18px) scale(.96);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
        .revenge-glow{animation:revengeGlow 2.5s ease-in-out infinite}.card-in{animation:cardIn .55s ease both}
      `}</style>

      <div className="revenge-glow pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.22),transparent_54%)]" />

      <section className="card-in relative w-full max-w-md overflow-hidden rounded-[42px] border border-cyan-200/18 bg-[#030816]/86 p-6 text-center shadow-2xl shadow-blue-500/15">
        <div className="text-[68px]">⚡</div>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.26em] text-cyan-100/70">Revenge unlocked</p>
        <h1 className="mt-2 text-5xl font-black leading-none text-white">MELKEIN</h1>

        <div className="mt-5 rounded-[34px] border border-white/10 bg-white/[.055] px-5 py-5">
          <div className="text-sm font-black uppercase tracking-wide text-white/45">Voittaja vei</div>
          <div className="mt-1 text-[52px] font-black leading-none text-cyan-100">€{amount}</div>
          <div className="mt-2 text-sm font-bold text-white/60">{winnerName}</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-[24px] border border-cyan-100/10 bg-cyan-300/10 px-3 py-4">
            <div className="text-2xl font-black text-white">{userScore}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/42">sinun score</div>
          </div>
          <div className="rounded-[24px] border border-cyan-100/10 bg-cyan-300/10 px-3 py-4">
            <div className="text-2xl font-black text-white">{gap}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/42">ero</div>
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-[320px] text-sm font-bold leading-relaxed text-white/66">
          Et voittanut tätä kierrosta, mutta seuraava viikko on nyt henkilökohtainen revanssi. Yksi vahvempi perustelu voi kääntää koko pelin.
        </p>

        {userEntry?.content && (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/28 px-4 py-3 text-left">
            <div className="text-[10px] font-black uppercase tracking-wide text-cyan-100/55">Sinun entry</div>
            <p className="mt-2 line-clamp-4 text-sm font-bold leading-snug text-white/70">{userEntry.content}</p>
          </div>
        )}

        <button onClick={onRevenge} className="mt-5 w-full rounded-[28px] bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-5 text-lg font-black text-white shadow-2xl shadow-cyan-500/25 active:scale-[0.98]">
          Valmistaudu revanssiin
        </button>
        <button onClick={onClose} className="mt-3 w-full rounded-[24px] border border-white/10 bg-white/[.055] px-6 py-4 text-sm font-black text-white/72 active:scale-[0.98]">
          Sulje
        </button>
      </section>
    </div>
  );
}
