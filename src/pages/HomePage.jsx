import { Link } from "react-router-dom";

function CharacterCard({ emoji, name, text, color }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/10 p-4 shadow-xl ${color}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-4xl shadow-lg">
          {emoji}
        </div>

        <div>
          <div className="font-black text-white">{name}</div>
          <div className="text-sm text-white/60">{text}</div>
        </div>
      </div>
    </div>
  );
}

function PotCard({ title, amount, text, badge, style }) {
  return (
    <div className={`relative overflow-hidden rounded-[32px] border p-6 shadow-2xl ${style}`}>
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-2xl" />

      <div className="relative">
        <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white/80">
          {badge}
        </div>

        <h3 className="mt-4 text-lg font-black">{title}</h3>

        <div className="mt-2 text-5xl font-black tracking-tight">
          {amount}
        </div>

        <p className="mt-3 text-sm text-white/70">{text}</p>
      </div>
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
      <div className="text-xs font-black tracking-[0.22em] text-cyan-200">
        {number}
      </div>
      <div className="mt-3 text-lg font-black text-white">{title}</div>
      <div className="mt-2 text-sm text-white/65">{text}</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050816]" />
        <div className="absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-cyan-500/30 blur-[120px]" />
        <div className="absolute right-[-10%] top-[15%] h-96 w-96 rounded-full bg-fuchsia-500/25 blur-[130px]" />
        <div className="absolute bottom-[-15%] left-[25%] h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-[150px]" />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="relative overflow-hidden rounded-[42px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl md:p-10">
          <div className="absolute right-8 top-8 hidden rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/70 md:block">
            🔔 Live-yhteisö aktiivinen
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
                AI-powered community support arena
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                KOLEHTI
              </h1>

              <p className="mt-5 max-w-2xl text-xl font-semibold text-white/80 md:text-2xl">
                Porukka pitää huolta. Kirjoita perustelu, vaikuta yhteisöön ja nouse rankingissa.
              </p>

              <p className="mt-4 max-w-2xl text-white/60">
                Yhteisöllinen peli, jossa tekoäly, äänestys ja porukan tuki yhdistyvät yhdeksi selkeäksi kokemukseksi.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/groups"
                  className="rounded-2xl bg-cyan-500 px-6 py-4 font-black text-white shadow-xl shadow-cyan-500/20"
                >
                  Aloita porukasta
                </Link>

                <Link
                  to="/feed"
                  className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 font-black text-white"
                >
                  Avaa ranking
                </Link>

                <Link
                  to="/login"
                  className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 font-black text-white/80"
                >
                  Kirjaudu
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="grid gap-4">
                <CharacterCard
                  emoji="👩‍🦱"
                  name="Laura"
                  text="Tarvitsee apua arjen kuluihin"
                  color="shadow-pink-500/10"
                />
                <CharacterCard
                  emoji="🧔"
                  name="Mikko"
                  text="Äänestää porukan parhaita perusteluja"
                  color="shadow-cyan-500/10"
                />
                <CharacterCard
                  emoji="👨‍🦳"
                  name="Kari"
                  text="Seuraa rankingia ja yhteisön muutoksia"
                  color="shadow-emerald-500/10"
                />
              </div>

              <div className="mt-4 rounded-[32px] border border-white/10 bg-gradient-to-br from-white/15 to-white/5 p-5 shadow-2xl">
                <div className="text-sm font-bold text-white/60">
                  Tämän hetken signaali
                </div>
                <div className="mt-2 text-2xl font-black">
                  Selkeät ja aidot perustelut nousevat tänään.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <PotCard
            title="Päiväpotti"
            amount="1000€"
            badge="AI analyysi"
            text="Tekoäly arvioi perusteluja ja nostaa vahvimmat esiin."
            style="border-emerald-300/20 bg-emerald-400/10"
          />

          <PotCard
            title="Viikkopotti"
            amount="3000€"
            badge="Porukan äänet"
            text="Yhteisö päättää viikonlopun vahvimman perustelun."
            style="border-cyan-300/20 bg-cyan-400/10"
          />

          <PotCard
            title="Kuukausipotti"
            amount="5000€"
            badge="Iso kierros"
            text="Kuukauden vaikuttavin perustelu nousee kärkeen."
            style="border-fuchsia-300/20 bg-fuchsia-400/10"
          />
        </section>

        <section className="mt-6 rounded-[38px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                Näin toimii
              </div>
              <h2 className="mt-2 text-3xl font-black">
                Yksi selkeä flow, joka pitää käyttäjän mukana
              </h2>
            </div>

            <Link
              to="/new"
              className="rounded-2xl bg-pink-500 px-5 py-3 text-center font-black text-white shadow-xl shadow-pink-500/20"
            >
              Kirjoita perustelu
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <Step number="01" title="Liity porukkaan" text="Valitse tai luo oma yhteisö." />
            <Step number="02" title="Kirjoita" text="Kerro miksi tarvitset tukea." />
            <Step number="03" title="Äänestä" text="Anna ääni parhaalle perustelulle." />
            <Step number="04" title="Ranking elää" text="TOP 3 muuttuu reaaliajassa." />
            <Step number="05" title="Porukka päättää" text="Yhteisö nostaa vahvimmat esiin." />
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[38px] border border-white/10 bg-white/10 p-6 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-200">
              Yhteisö
            </div>
            <h2 className="mt-2 text-3xl font-black">
              Porukoita syntyy sitä mukaa kun ihmiset liittyvät.
            </h2>
            <p className="mt-4 text-white/65">
              Jokainen porukka toimii omana yhteisönään: omat perustelut, omat äänet ja oma ranking.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-sm text-white/50">Porukan koko</div>
                <div className="text-3xl font-black">~1400 hlö</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-sm text-white/50">Rakenne</div>
                <div className="text-3xl font-black">Suomi sekoitettuna</div>
              </div>
            </div>
          </div>

          <div className="rounded-[38px] border border-white/10 bg-gradient-to-br from-fuchsia-500/20 via-cyan-500/10 to-emerald-500/10 p-6 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-200">
              Live-tunnelma
            </div>
            <h2 className="mt-2 text-3xl font-black">
              Ranking, äänet ja perustelut tekevät kokemuksesta elävän.
            </h2>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                🏆 TOP 1 korostuu automaattisesti
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                ❤️ Äänestys estää tuplaäänet
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                👥 Feed toimii porukkakohtaisesti
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
