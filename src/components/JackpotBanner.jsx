import { Link } from "react-router-dom";

export default function JackpotBanner({ topPost }) {
  return (
    <section className="mb-5 overflow-hidden rounded-[34px] border border-yellow-300/30 bg-yellow-500/10 p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-yellow-200">
            🎰 Päivän kierros
          </div>

          <h2 className="mt-1 text-2xl font-black">
            1000 € potti käynnissä
          </h2>

          <p className="mt-2 text-sm font-bold text-white/60">
            {topPost
              ? `Kärjessä nyt: ${topPost.content?.slice(0, 44)}...`
              : "Luo perustelu ja nouse mukaan."}
          </p>
        </div>

        <Link
          to="/new"
          className="shrink-0 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black"
        >
          Osallistu
        </Link>
      </div>
    </section>
  );
}
