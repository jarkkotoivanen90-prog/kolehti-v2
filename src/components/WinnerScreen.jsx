import { useEffect } from "react";

export default function WinnerScreen({ winner, amount = 0, race, payoutStatus = "preview", onClose }) {
  useEffect(() => {
    try { navigator.vibrate?.([90, 40, 160]); } catch {}
  }, []);

  if (!winner) return null;

  const isBot = Boolean(winner.bot);
  const name = isBot ? winner.bot_name || "Pelibotti" : "Pelaaja";
  const statusText = payoutStatus === "paid"
    ? "Payout merkitty"
    : payoutStatus === "failed"
      ? "Payout odottaa vahvistusta"
      : "Payout preview";

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center overflow-hidden bg-[#02040c]/94 px-5 text-white backdrop-blur-2xl">
      <style>{`
        @keyframes crownDrop{0%{transform:translateY(-24px) scale(.8);opacity:0}60%{transform:translateY(4px) scale(1.08);opacity:1}100%{transform:translateY(0) scale(1)}}
        @keyframes winGlow{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.9;transform:scale(1.08)}}
        @keyframes coinPop{0%{transform:translateY(18px) scale(.9);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
        .crown-drop{animation:crownDrop .72s cubic-bezier(.2,1.4,.2,1) both}.win-glow{animation:winGlow 2.4s ease-in-out infinite}.coin-pop{animation:coinPop .6s ease both}
      `}</style>

      <div className="win-glow pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.30),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.18),transparent_28%),radial-gradient(circle_at_80%_75%,rgba(255,255,255,.08),transparent_26%)]" />

      <section className="relative w-full max-w-md overflow-hidden rounded-[42px] border border-cyan-200/25 bg-[#030816]/82 p-6 text-center shadow-2xl shadow-cyan-500/20">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
        <div className="crown-drop text-[76px]">🏆</div>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.26em] text-cyan-100/70">Winner locked</p>
        <h1 className="mt-2 text-5xl font-black leading-none text-white">VOITTAJA</h1>

        <div className="coin-pop mt-5 rounded-[34px] border border-cyan-100/15 bg-cyan-300/10 px-5 py-5">
          <div className="text-[58px] font-black leading-none text-cyan-100">€{amount}</div>
          <div className="mt-1 text-xs font-black uppercase tracking-wide text-white/48">payout amount</div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-[22px] border border-cyan-100/15 bg-white/[.06] text-xl font-black text-cyan-100">
            {isBot ? winner.bot_avatar || "🤖" : "★"}
          </div>
          <div className="text-left">
            <div className="text-2xl font-black text-white">{name}</div>
            <div className="text-xs font-black uppercase tracking-wide text-cyan-100/55">{isBot ? "Pelibotti" : "Pelaaja"} · {winner.winner_score || winner.score || 0} pts</div>
          </div>
        </div>

        <p className="mx-auto mt-5 line-clamp-5 max-w-[320px] text-sm font-bold leading-relaxed text-white/66">“{winner.content}”</p>

        {race?.runnerUp && (
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[.045] px-4 py-3 text-left">
            <div className="text-[10px] font-black uppercase tracking-wide text-white/42">Runner up</div>
            <div className="mt-1 text-sm font-black text-white/80">{race.runnerUp.bot ? `🤖 ${race.runnerUp.bot_name}` : "Pelaaja"}</div>
            <div className="mt-1 text-xs font-bold text-white/50">Ero {race.gap || 0} pistettä</div>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-cyan-100/10 bg-[#071426]/80 px-4 py-3 text-xs font-black uppercase tracking-wide text-cyan-100/70">{statusText}</div>

        <button onClick={onClose} className="mt-5 w-full rounded-[28px] bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-5 text-lg font-black text-white shadow-2xl shadow-cyan-500/25 active:scale-[0.98]">
          Jatka
        </button>
      </section>
    </div>
  );
}
