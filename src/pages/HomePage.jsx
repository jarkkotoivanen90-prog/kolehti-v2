import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white">

      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-400/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-500/20 blur-[140px] rounded-full" />
      </div>

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* HERO */}
        <section className="grid lg:grid-cols-2 gap-10 items-center">

          {/* LEFT */}
          <div>
            <div className="flex items-center gap-4">
              <div className="text-5xl">🤝</div>
              <h1 className="text-5xl font-black">KOLEHTI</h1>
            </div>

            <p className="mt-4 text-lg text-white/70 font-semibold">
              Yhdessä voimme. Porukka pitää huolta.
            </p>

            <h2 className="mt-6 text-4xl font-black leading-tight">
              Kirjoita perustelu.  
              Nouse kärkeen.
            </h2>

            <p className="mt-4 text-white/60">
              Yhteisö päättää, tekoäly analysoi ja parhaat nousevat näkyviin.
            </p>

            {/* CTA */}
            <div className="mt-6 flex gap-3 flex-wrap">
              <Link
                to="/groups"
                className="bg-cyan-500 px-6 py-3 rounded-xl font-black shadow-lg"
              >
                Aloita
              </Link>

              <Link
                to="/feed"
                className="bg-white/10 border border-white/20 px-6 py-3 rounded-xl font-black"
              >
                Ranking
              </Link>

              <Link
                to="/new"
                className="bg-pink-500 px-6 py-3 rounded-xl font-black shadow-lg"
              >
                Kirjoita
              </Link>
            </div>
          </div>

          {/* RIGHT (CHARACTERS SIMPLIFIED) */}
          <div className="grid grid-cols-3 gap-3">
            {["👩‍🦱", "🧔", "👩‍🎓", "👨‍👧", "👩‍⚕️", "👨‍💻"].map((c, i) => (
              <div
                key={i}
                className="bg-white/10 border border-white/10 rounded-2xl p-6 text-center text-3xl shadow-lg"
              >
                {c}
              </div>
            ))}
          </div>
        </section>

        {/* POT CARDS */}
        <section className="mt-12 grid md:grid-cols-3 gap-4">

          <div className="bg-emerald-500/20 border border-emerald-300/30 rounded-2xl p-6">
            <div className="text-sm font-bold text-white/70">PÄIVITTÄIN</div>
            <div className="text-4xl font-black mt-2">1000 €</div>
            <p className="text-sm mt-2 text-white/60">
              AI jakaa parhaille perusteluille
            </p>
          </div>

          <div className="bg-cyan-500/20 border border-cyan-300/30 rounded-2xl p-6">
            <div className="text-sm font-bold text-white/70">VIIKOITTAIN</div>
            <div className="text-4xl font-black mt-2">3000 €</div>
            <p className="text-sm mt-2 text-white/60">
              Yhteisö äänestää voittajan
            </p>
          </div>

          <div className="bg-pink-500/20 border border-pink-300/30 rounded-2xl p-6">
            <div className="text-sm font-bold text-white/70">KUUKAUSITTAIN</div>
            <div className="text-4xl font-black mt-2">5000 €</div>
            <p className="text-sm mt-2 text-white/60">
              Suurin potti voittajalle
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-12">
          <h2 className="text-2xl font-black mb-4">Näin toimii</h2>

          <div className="grid md:grid-cols-5 gap-3">

            {[
              ["📱", "Kirjoita"],
              ["💚", "Äänestä"],
              ["🤖", "AI analysoi"],
              ["👥", "Yhteisö päättää"],
              ["🏆", "Voita"],
            ].map(([emoji, text], i) => (
              <div
                key={i}
                className="bg-white/10 border border-white/10 rounded-xl p-4 text-center"
              >
                <div className="text-3xl">{emoji}</div>
                <div className="mt-2 font-black text-sm">{text}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="mt-12 text-center">
          <h2 className="text-3xl font-black">
            Aloita nyt
          </h2>

          <p className="text-white/60 mt-2">
            Liity porukkaan ja vaikuta.
          </p>

          <Link
            to="/groups"
            className="inline-block mt-6 bg-cyan-500 px-8 py-4 rounded-xl font-black shadow-lg"
          >
            Siirry porukoihin
          </Link>
        </section>

      </main>
    </div>
  );
}
