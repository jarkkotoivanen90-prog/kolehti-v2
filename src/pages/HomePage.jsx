import { Link } from "react-router-dom";
import CharacterAvatar from "../components/CharacterAvatar";
import DynamicSlogan from "../components/DynamicSlogan";
import { characters, kaiCharacter } from "../data/characters";

function Card({ children, className = "", bg = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl ${className}`}
      style={
        bg
          ? {
              backgroundImage: `linear-gradient(rgba(5,8,22,.58), rgba(5,8,22,.82)), url(${bg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function InfoCard({ icon, title, text, bg }) {
  return (
    <Card className="h-40 p-4" bg={bg}>
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-2 text-[13px] font-black uppercase leading-tight text-cyan-200">
        {title}
      </h3>
      <p className="mt-2 text-[13px] font-bold leading-snug text-white/90">
        {text}
      </p>
      <div className="absolute bottom-3 right-4 text-3xl text-white/70">›</div>
    </Card>
  );
}

function PotCard({ title, amount, text, color, bg }) {
  return (
    <Card className="h-44 p-4" bg={bg}>
      <h3 className={`text-[13px] font-black uppercase ${color}`}>{title}</h3>
      <div className={`mt-2 text-4xl font-black leading-none ${color}`}>
        {amount}
      </div>
      <p className="mt-4 text-[14px] font-bold leading-snug text-white/90">
        {text}
      </p>
    </Card>
  );
}

function SmallCard({ icon, title, text }) {
  return (
    <Card className="h-28 p-3">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-1 text-[12px] font-black uppercase leading-tight">
        {title}
      </h3>
      <p className="mt-1 text-[12px] font-medium leading-snug text-white/75">
        {text}
      </p>
    </Card>
  );
}

function StepCard({ number, character, title, text, bg }) {
  return (
    <Card className="h-36 min-w-[150px] p-3" bg={bg}>
      <div className="absolute left-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-sm font-black">
        {number}
      </div>

      <div className="flex h-full flex-col justify-end">
        {character ? (
          <div className="absolute left-1/2 top-3 -translate-x-1/2">
            <CharacterAvatar
              character={character}
              size="md"
              showInfo={false}
              compact
            />
          </div>
        ) : null}

        <h3 className="text-sm font-black uppercase leading-tight text-cyan-200">
          {title}
        </h3>
        <p className="mt-1 text-[12px] font-bold leading-snug text-white/80">
          {text}
        </p>
      </div>
    </Card>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[32px] border border-white/10 bg-[#061126]/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-black">
        <Link to="/" className="text-cyan-300">
          <div className="text-2xl">🏠</div>
          <div>Koti</div>
        </Link>

        <Link to="/feed">
          <div className="text-2xl">📋</div>
          <div>Perustelut</div>
        </Link>

        <Link to="/new" className="-mt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">
            +
          </div>
          <div>Uusi perustelu</div>
        </Link>

        <Link to="/vote">
          <div className="text-2xl">👥</div>
          <div>Äänestä</div>
        </Link>

        <Link to="/profile">
          <div className="text-2xl">👤</div>
          <div>Profiili</div>
        </Link>
      </div>
    </nav>
  );
}

export default function HomePage() {
  const cityImages = {
    helsinki:
      "https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=900&q=80",
    harbour:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    forest:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80",
    lake:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    city:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80",
    nature:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80",
  };

  return (
    <div className="min-h-screen bg-[#050816] pb-32 text-white">
      <style>{`
        @keyframes floatHero {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes glowHero {
          0%,100% { box-shadow: 0 0 35px rgba(168,85,247,.25); }
          50% { box-shadow: 0 0 85px rgba(236,72,153,.45); }
        }

        .hero-float {
          animation: floatHero 4s ease-in-out infinite;
        }

        .hero-glow {
          animation: glowHero 3.2s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_42%,#02030a_100%)]" />

      <main className="mx-auto max-w-md px-4 py-5">
        <header className="mb-5 flex items-center justify-between gap-3">
          <button className="grid h-16 w-16 place-items-center rounded-3xl border border-white/15 bg-white/10 text-4xl shadow-xl">
            ☰
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl">🤝</span>
              <h1 className="text-5xl font-black tracking-tight">KOLEHTI</h1>
            </div>
            <p className="mt-1 text-xs font-black uppercase leading-tight text-white/65">
              Me pidämme huolta – yhdessä voitamme.
            </p>
          </div>

          <Link to="/profile" className="relative">
            <CharacterAvatar
              character={characters[1]}
              size="sm"
              showInfo={false}
              compact
            />
            <div className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-blue-500 text-sm font-black">
              3
            </div>
          </Link>
        </header>

        <section
          className="hero-glow relative h-[360px] overflow-hidden rounded-[34px] border border-purple-400/60 shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(rgba(5,8,22,.18), rgba(5,8,22,.78)), url(${cityImages.helsinki})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent" />

          <div className="absolute inset-x-0 bottom-20 flex items-end justify-center -space-x-8 px-2">
            {characters.slice(0, 5).map((character, index) => (
              <div
                key={character.id}
                className="hero-float"
                style={{
                  animationDelay: `${index * 0.25}s`,
                  transform: `scale(${index === 2 ? 1.14 : 1})`,
                  zIndex: index === 2 ? 20 : 10 - index,
                }}
              >
                <CharacterAvatar
                  character={character}
                  size={index === 2 ? "xl" : "lg"}
                  showInfo={false}
                  compact
                />
              </div>
            ))}
          </div>

          <DynamicSlogan mood="premium Finnish community game short powerful" />
        </section>

        <section className="mt-4 grid grid-cols-3 gap-3">
          <InfoCard
            icon="👥"
            title="Porukan koko"
            text="~1400 jäsentä. Porukoita syntyy lisää kasvun mukana."
            bg={cityImages.harbour}
          />

          <InfoCard
            icon="🇫🇮"
            title="Jäsenet ympäri Suomea"
            text="Porukoiden nimet ovat oikeita, mutta jäsenet sekoitetaan."
            bg={cityImages.forest}
          />

          <InfoCard
            icon="💚"
            title="Tavoitteemme"
            text="Yhteisön hyvä ja huolenpito kaikista."
            bg={cityImages.lake}
          />
        </section>

        <section className="mt-7">
          <h2 className="mb-3 text-3xl font-black">
            RAHAPOTIT{" "}
            <span className="rounded-full bg-white/10 px-3 text-xl">?</span>
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <PotCard
              title="Päivittäin"
              amount="1000 €"
              color="text-emerald-300"
              text="Tekoälyn suorittama jako perustelujen perusteella."
              bg={cityImages.city}
            />

            <PotCard
              title="Viikottain"
              amount="3000 €"
              color="text-blue-300"
              text="Äänestys porukan kesken joka viikonloppu."
              bg={cityImages.nature}
            />

            <PotCard
              title="Kuukausittain"
              amount="5000 €"
              color="text-pink-300"
              text="Äänestys kuukauden lopussa."
              bg={cityImages.helsinki}
            />
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <SmallCard icon="🪙" title="1 € / päivä" text="Kuukauden kesto 30 €" />
            <SmallCard icon="🎟️" title="Osallistu" text="Päiväpottiin 5 €" />
            <SmallCard icon="🎥" title="Video" text="Perustelu 2 €" />
            <SmallCard icon="🚀" title="Boostit" text="Korosta perusteluasi" />
          </div>
        </section>

        <section className="mt-7">
          <h2 className="mb-3 text-3xl font-black">
            NÄIN PELI TOIMII{" "}
            <span className="rounded-full bg-white/10 px-3 text-xl">?</span>
          </h2>

          <div className="flex gap-3 overflow-x-auto pb-2">
            <StepCard
              number="1"
              character={characters[0]}
              title="Kirjoita"
              text="Kerro selkeästi miksi tarvitset tukea."
              bg={cityImages.forest}
            />
            <StepCard
              number="2"
              character={characters[1]}
              title="Äänestä"
              text="Anna ääni perustelulle, johon uskot."
              bg={cityImages.harbour}
            />
            <StepCard
              number="3"
              character={kaiCharacter}
              title="AI analysoi"
              text="Tekoäly arvioi laadun ja selkeyden."
              bg={cityImages.helsinki}
            />
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <Card className="h-56 p-5">
            <div className="text-5xl">👥</div>
            <h3 className="mt-3 text-xl font-black uppercase leading-tight text-purple-300">
              Jaa peliä kavereillesi
            </h3>
            <p className="mt-3 text-base font-medium leading-snug text-white/70">
              Jokaisesta uudesta jäsenestä yhteisö kasvaa.
            </p>
          </Card>

          <Card className="h-56 p-5">
            <div className="text-5xl">📈</div>
            <h3 className="mt-3 text-xl font-black uppercase leading-tight text-emerald-300">
              Älykäs todennäköisyys
            </h3>
            <p className="mt-3 text-base font-medium leading-snug text-white/70">
              Ranking elää äänten ja ajan mukana.
            </p>
            <div className="mt-3 text-5xl font-black text-emerald-300">3,2%</div>
          </Card>

          <Card className="h-44 p-5">
            <div className="text-5xl">🛡️</div>
            <h3 className="mt-3 text-xl font-black uppercase leading-tight text-blue-300">
              Reilut säännöt
            </h3>
            <p className="mt-3 text-base font-medium text-white/70">
              Yksi ääni per käyttäjä.
            </p>
          </Card>

          <Card className="h-44 p-5">
            <div className="text-5xl">💗</div>
            <h3 className="mt-3 text-xl font-black uppercase leading-tight text-pink-300">
              Yhdessä rakennamme
            </h3>
            <p className="mt-3 text-base font-medium text-white/70">
              Tämä on enemmän kuin peli.
            </p>
          </Card>
        </section>

        <Link
          to="/feed"
          className="mt-5 flex items-center gap-4 rounded-[30px] border border-purple-400/40 bg-purple-500/20 p-4 shadow-2xl"
        >
          <div className="grid h-24 w-32 place-items-center rounded-3xl bg-black/35 text-6xl">
            ▶
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-black leading-tight">
              PUOLIVUOSITTAIN – SUURI POTTIJAKO!
            </h3>
            <p className="mt-2 text-base font-medium leading-snug text-white/70">
              Suuremman potin jako parhaiden perustelujen kesken.
            </p>
          </div>

          <div className="text-5xl">›</div>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
