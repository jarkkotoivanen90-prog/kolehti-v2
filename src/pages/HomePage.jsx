import { Link } from "react-router-dom";
import CharacterAvatar from "../components/CharacterAvatar";
import { characters, kaiCharacter } from "../data/characters";

function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[26px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.16),transparent_35%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function InfoCard({ icon, title, children, color }) {
  return (
    <GlassCard className={`p-4 ${color}`}>
      <div className="flex gap-3">
        <div className="text-4xl">{icon}</div>
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-cyan-200">
            {title}
          </div>
          <div className="mt-1 text-sm font-semibold text-white/85">
            {children}
          </div>
        </div>
      </div>
      <div className="mt-2 text-right text-2xl text-white/60">›</div>
    </GlassCard>
  );
}

function PotCard({ title, amount, icon, color, children }) {
  return (
    <GlassCard className={`p-5 ${color}`}>
      <div className="flex justify-between gap-3">
        <div>
          <div className="text-sm font-black uppercase tracking-wide">
            {title}
          </div>
          <div className="mt-2 text-4xl font-black">{amount}</div>
        </div>

        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-3xl">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold text-white/80">{children}</p>
    </GlassCard>
  );
}

function Step({ n, title, text, children }) {
  return (
    <div className="min-w-[135px] flex-1">
      <GlassCard className="h-28 p-2">
        <div className="flex h-full items-center justify-center">{children}</div>
        <div className="absolute bottom-1 left-1 grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-xs font-black">
          {n}
        </div>
      </GlassCard>

      <div className="mt-2 text-xs font-black uppercase text-cyan-300">
        {title}
      </div>
      <div className="mt-1 text-xs font-medium text-white/70">{text}</div>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[28px] border border-white/10 bg-[#081226]/95 px-4 py-2 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-bold">
        <Link to="/" className="text-blue-400">
          🏠<div>Koti</div>
        </Link>

        <Link to="/feed">
          📋<div>Perustelut</div>
        </Link>

        <Link to="/new" className="-mt-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-500 text-4xl shadow-xl shadow-blue-500/40">
            +
          </div>
          <div>Uusi perustelu</div>
        </Link>

        <Link to="/vote">
          👥<div>Äänestä</div>
        </Link>

        <Link to="/profile">
          👤<div>Profiili</div>
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050816] pb-28 text-white">
      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .float-soft {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_42%,#02030a_100%)]" />

      <main className="mx-auto max-w-md px-4 py-4">
        <header className="flex items-center justify-between">
          <button className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/10 text-4xl">
            ☰
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="text-4xl">🤝</div>
              <h1 className="text-4xl font-black tracking-tight">KOLEHTI</h1>
            </div>
            <p className="text-[10px] font-black uppercase text-white/70">
              Me pidämme huolta – yhdessä voitamme.
            </p>
          </div>

          <Link to="/profile" className="relative">
            <div className="grid h-14 w-14 place-items-center rounded-full border border-cyan-300/40 bg-blue-500/30">
              <CharacterAvatar
                character={characters[1]}
                size="sm"
                showInfo={false}
              />
            </div>

            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-blue-500 text-xs font-black">
              3
            </span>
          </Link>
        </header>

        <section className="mt-5 overflow-hidden rounded-[26px] border border-fuchsia-400/40 bg-gradient-to-br from-purple-700/50 to-blue-950 shadow-2xl">
          <div className="relative h-72">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,166,77,.45),transparent_38%)]" />

            <div className="absolute inset-x-0 bottom-8 flex items-end justify-center -space-x-8 px-2">
              {characters.slice(0, 5).map((character, index) => (
                <div
                  key={character.id}
                  className="float-soft"
                  style={{ animationDelay: `${index * 0.25}s` }}
                >
                  <CharacterAvatar
                    character={character}
                    size={index === 2 ? "xl" : "lg"}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent" />

            <div className="absolute bottom-5 left-0 right-0 text-center">
              <h2 className="text-2xl font-black">
                Porukka pitää huolta.
                <br />
                <span className="text-pink-400">Yhdessä voimme.</span>
              </h2>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-3 gap-2">
          <InfoCard icon="👥" title="Porukan koko" color="border-blue-400/50">
            <b className="text-xl">~1400</b>
            <br />
            jäsentä
          </InfoCard>

          <InfoCard
            icon="🇫🇮"
            title="Jäsenet ympäri Suomea"
            color="border-purple-400/50"
          >
            Porukoiden nimet ovat oikeita, jäsenet sekoitetaan.
          </InfoCard>

          <InfoCard icon="💚" title="Tavoitteemme" color="border-green-400/50">
            Yhteisöllisyys ja huolenpito.
          </InfoCard>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-xl font-black">
            RAHAPOTIT{" "}
            <span className="rounded-full bg-white/10 px-2 text-sm">?</span>
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <PotCard
              title="Päivittäin"
              amount="1000 €"
              icon="📅"
              color="border-green-400/50 text-green-300"
            >
              Tekoälyn suorittama jako perustelujen perusteella.
            </PotCard>

            <PotCard
              title="Viikottain"
              amount="3000 €"
              icon="📅"
              color="border-blue-400/50 text-blue-300"
            >
              Äänestys porukan kesken joka viikonloppu.
            </PotCard>

            <PotCard
              title="Kuukausittain"
              amount="5000 €"
              icon="📅"
              color="border-pink-400/50 text-pink-300"
            >
              Äänestys kuukauden lopussa.
            </PotCard>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              ["🪙", "1 € / päivä", "Kuukauden kesto 30 €"],
              ["🎟️", "Osallistu", "Päiväpottiin 5 €"],
              ["🎥", "Video", "Perustelu 2 €"],
              ["🚀", "Boostit", "Korosta perusteluasi"],
            ].map(([icon, title, text]) => (
              <GlassCard key={title} className="p-3">
                <div className="text-3xl">{icon}</div>
                <div className="mt-1 text-xs font-black uppercase">
                  {title}
                </div>
                <div className="mt-1 text-[11px] text-white/70">{text}</div>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-xl font-black">
            NÄIN PELI TOIMII{" "}
            <span className="rounded-full bg-white/10 px-2 text-sm">?</span>
          </h2>

          <div className="flex gap-3 overflow-x-auto pb-2">
            <Step
              n="1"
              title="Kirjoita perustelu"
              text="Kerro miksi tarvitset rahaa."
            >
              <CharacterAvatar
                character={characters[0]}
                size="md"
                showInfo={false}
              />
            </Step>

            <Step n="2" title="Anna äänesi" text="Sinun ääni vaikuttaa.">
              <CharacterAvatar
                character={characters[1]}
                size="md"
                showInfo={false}
              />
            </Step>

            <Step n="3" title="Tekoäly analysoi" text="AI valitsee parhaat.">
              <CharacterAvatar
                character={kaiCharacter}
                size="md"
                showInfo={false}
              />
            </Step>

            <Step n="4" title="Yhteisö äänestää" text="Porukka ratkaisee.">
              <div className="flex -space-x-5">
                <CharacterAvatar
                  character={characters[2]}
                  size="sm"
                  showInfo={false}
                />
                <CharacterAvatar
                  character={characters[3]}
                  size="sm"
                  showInfo={false}
                />
                <CharacterAvatar
                  character={characters[4]}
                  size="sm"
                  showInfo={false}
                />
              </div>
            </Step>

            <Step n="5" title="Voittaja palkitaan" text="Voittaja saa rahapotin.">
              <CharacterAvatar
                character={characters[4]}
                size="md"
                showInfo={false}
              />
            </Step>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <GlassCard className="border-purple-400/40 p-4">
            <div className="text-4xl">👥</div>
            <h3 className="mt-2 text-sm font-black uppercase text-purple-300">
              Jaa peliä kavereillesi
            </h3>
            <p className="mt-2 text-xs text-white/70">
              Jokaisesta uudesta jäsenestä yhteisö kasvaa.
            </p>
          </GlassCard>

          <GlassCard className="border-green-400/40 p-4">
            <div className="text-4xl">📈</div>
            <h3 className="mt-2 text-sm font-black uppercase text-green-300">
              Älykäs todennäköisyys
            </h3>
            <p className="mt-2 text-xs text-white/70">
              Ranking elää äänten ja ajan mukana.
            </p>
            <div className="mt-2 text-4xl font-black text-green-300">3,2%</div>
          </GlassCard>

          <GlassCard className="border-blue-400/40 p-4">
            <div className="text-4xl">🛡️</div>
            <h3 className="mt-2 text-sm font-black uppercase text-blue-300">
              Reilut säännöt
            </h3>
            <p className="mt-2 text-xs text-white/70">
              Yksi ääni per käyttäjä.
            </p>
          </GlassCard>

          <GlassCard className="border-pink-400/40 p-4">
            <div className="text-4xl">💗</div>
            <h3 className="mt-2 text-sm font-black uppercase text-pink-300">
              Yhdessä rakennamme
            </h3>
            <p className="mt-2 text-xs text-white/70">
              Tämä on enemmän kuin peli.
            </p>
          </GlassCard>
        </section>

        <Link
          to="/feed"
          className="mt-5 flex items-center gap-4 rounded-[24px] border border-purple-400/40 bg-purple-500/20 p-4 shadow-2xl"
        >
          <div className="grid h-20 w-28 place-items-center rounded-2xl bg-black/30 text-5xl">
            ▶
          </div>

          <div className="flex-1">
            <h3 className="font-black">PUOLIVUOSITTAIN – SUURI POTTIJAKO!</h3>
            <p className="mt-1 text-sm text-white/70">
              Suuremman potin jako parhaiden perustelujen kesken.
            </p>
          </div>

          <div className="text-3xl">›</div>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
