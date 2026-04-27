import { Link } from "react-router-dom";

export default function DailyWinnerBanner({ winnerPost, winner }) {
  if (!winnerPost && !winner) {
    return (
      <section className="rounded-[34px] border border-yellow-300/25 bg-yellow-500/10 p-5 shadow-2xl">
        <div className="text-xs font-black uppercase tracking-wide text-yellow-200">
          👑 Päivän voittaja
        </div>

        <h2 className="mt-2 text-2xl font-black">Voittaja ei ole vielä lukittu</h2>

        <p className="mt-2 text-sm font-bold text-white/60">
          Nouse päivän kärkeen ja nappaa +100 XP.
        </p>

        <Link
          to="/new"
          className="mt-4 block rounded-2xl bg-yellow-400 px-5 py-4 text-center font-black text-black"
        >
          Osallistu
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[34px] border border-yellow-300/40 bg-yellow-500/15 p-5 shadow-2xl">
      <div className="text-xs font-black uppercase tracking-wide text-yellow-200">
        👑 Päivän voittaja
      </div>

      <h2 className="mt-2 text-3xl font-black text-yellow-100">
        +100 XP palkinto
      </h2>

      <p className="mt-3 text-base font-black text-white">
        {winnerPost?.content || "Päivän paras perustelu"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
        <span className="rounded-full bg-black/30 px-3 py-2 text-yellow-100">
          💗 {winnerPost?.vote_count || winner?.vote_count || 0} ääntä
        </span>

        <span className="rounded-full bg-black/30 px-3 py-2 text-cyan-100">
          ⚡ Score {Math.round(winnerPost?.viral_score || winner?.score || 0)}
        </span>

        <span className="rounded-full bg-black/30 px-3 py-2 text-white/80">
          👑 Lukittu tänään
        </span>
      </div>
    </section>
  );
}
