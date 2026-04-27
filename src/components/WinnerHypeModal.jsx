import { Link } from "react-router-dom";

export default function WinnerHypeModal({ winner, onClose }) {
  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-black/75 px-5 backdrop-blur-xl">
      <div className="w-full max-w-sm rounded-[36px] border border-yellow-300/30 bg-[#071226] p-6 text-center text-white shadow-2xl shadow-yellow-400/20">
        <div className="text-7xl">🏆</div>
        <p className="mt-3 text-xs font-black uppercase tracking-[0.35em] text-yellow-200">
          Voittaja
        </p>
        <h2 className="mt-2 text-4xl font-black">Sinä voitit!</h2>
        <p className="mt-3 text-sm font-bold text-white/65">
          {winner.reward_label || "Potti"} · {winner.votes || 0} tykkäystä
        </p>

        <div className="mt-5 rounded-3xl bg-yellow-400/10 p-4 text-left">
          <div className="text-xs font-black text-yellow-100">Seuraava tavoite</div>
          <div className="mt-1 text-lg font-black">Pidä streak yllä ja tähtää kuukausipottiin 💎</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-black">
            Sulje
          </button>
          <Link to="/pots" className="rounded-2xl bg-yellow-400 px-4 py-3 font-black text-black">
            Katso potit
          </Link>
        </div>
      </div>
    </div>
  );
}
