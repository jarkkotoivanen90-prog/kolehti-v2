import { Link } from "react-router-dom";

function Person({ type = "woman", delay = 0 }) {
  const hair =
    type === "blonde"
      ? "bg-yellow-300"
      : type === "worker"
      ? "bg-stone-800"
      : type === "man"
      ? "bg-stone-900"
      : "bg-amber-700";

  const outfit =
    type === "worker"
      ? "bg-lime-600"
      : type === "blonde"
      ? "bg-purple-600"
      : type === "man"
      ? "bg-blue-900"
      : "bg-emerald-700";

  return (
    <div
      className="relative h-32 w-24 shrink-0 animate-[float_4s_ease-in-out_infinite]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`absolute bottom-0 left-3 h-20 w-18 rounded-t-[2rem] ${outfit} shadow-xl`} />
      <div className="absolute bottom-14 left-5 h-16 w-16 rounded-[1.5rem] bg-[#f1c3a1]" />
      <div className={`absolute bottom-[6.4rem] left-3 h-9 w-20 rounded-t-full ${hair}`} />
      <div className="absolute bottom-[4.65rem] left-9 h-2 w-2 rounded-full bg-slate-950" />
      <div className="absolute bottom-[4.65rem] right-9 h-2 w-2 rounded-full bg-slate-950" />
      <div className="absolute bottom-[3.7rem] left-1/2 h-2 w-7 -translate-x-1/2 rounded-full bg-rose-500" />
      {type === "worker" && (
        <div className="absolute bottom-20 left-2 h-3 w-20 rounded-full bg-yellow-300" />
      )}
    </div>
  );
}

function Robot() {
  return (
    <div className="relative h-32 w-28 animate-[float_3s_ease-in-out_infinite]">
      <div className="absolute bottom-2 left-3 h-20 w-22 rounded-[2rem] bg-white shadow-xl" />
      <div className="absolute bottom-17 left-3 h-16 w-22 rounded-[2rem] border-4 border-white bg-slate-950 shadow-xl">
        <div className="mt-5 flex justify-center gap-4">
          <div className="h-3 w-3 rounded-full bg-cyan-300 shadow-cyan-300/80 shadow-lg" />
          <div className="h-3 w-3 rounded-full bg-cyan-300 shadow-cyan-300/80 shadow-lg" />
        </div>
        <div className="mx-auto mt-3 h-2 w-8 rounded-full bg-cyan-300" />
      </div>
      <div className="absolute bottom-24 left-12 h-5 w-2 rounded-full bg-white" />
      <div className="absolute bottom-[7.1rem] left-10 h-3 w-7 rounded-full bg-cyan-300" />
    </div>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-[26px] border border-white/15 bg-white/8 shadow-2xl backdrop-blur-xl ${className}`}>
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
          <div className="text-sm font-black uppercase tracking-wide">{title}</div>
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
      <GlassCard className="h-24 p-2">
        <div className="flex h-full items-center justify-center">{children}</div>
        <div className="absolute bottom-1 left-1 grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-xs font-black">
          {n}
        </div>
      </GlassCard>
      <div className="mt-2 text-xs font-black uppercase text-cyan-300">{title}</div>
      <div className="mt-1 text-xs font-medium text-white/70">{text}</div>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[28px] border border-white/10 bg-[#081226]/95 px-4 py-2 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-bold">
        <Link to="/" className="text-blue-400">🏠<div>Koti</div></Link>
        <Link to="/feed">📋<div>Perustelut</div></Link>
        <Link to="/new" className="-mt-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-500 text-4xl shadow-xl shadow-blue-500/40">+</div>
          <div>Uusi perustelu</div>
        </Link>
        <Link to="/vote">👥<div>Äänestä</div></Link>
        <Link to="/profile">👤<div>Profiili</div></Link>
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
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_42%,#02030a_100%)]" />

      <main className="mx-auto max-w-md px-4 py-4">
        <header className="flex items-center justify-between">
          <button className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/8 text-4xl">
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
              <Person type="man" />
            </div>
            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-blue-500 text-xs font-black">
              3
            </span>
          </Link>
        </header>

        <section className="mt-5 overflow-hidden rounded-[26px] border border-fuchsia-400/40 bg-gradient-to-br from-purple-700/50 to-blue-950 shadow-2xl">
          <div className="relative h-64">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,166,77,.45),transparent_38%)]" />
            <div className="absolute inset-x-0 bottom-4 flex items-end justify-center gap-[-10px]">
              <Person type="man" delay={0} />
              <Person type="woman" delay={0.2} />
              <Person type="man" delay={0.4} />
              <Person type="blonde" delay={0.6} />
              <Person type="worker" delay={0.8} />
              <Person type="blonde" delay={1} />
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
            <b className="text-xl">~1400</b><br />jäsentä
          </InfoCard>
          <InfoCard icon="🇫🇮" title="Jäsenet ympäri Suomea" color="border-purple-400/50">
            Porukoiden nimet ovat oikeita, jäsenet sekoitetaan.
          </InfoCard>
          <InfoCard icon="💚" title="Tavoitteemme" color="border-green-400/50">
            Yhteisöllisyys ja huolenpito.
          </InfoCard>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-xl font-black">RAHAPOTIT <span className="rounded-full bg-white/10 px-2 text-sm">?</span></h2>

          <div className="grid grid-cols-3 gap-2">
            <PotCard title="Päivittäin" amount="1000 €" icon="📅" color="border-green-400/50 text-green-300">
              Tekoälyn suorittama jako perustelujen perusteella.
            </PotCard>
            <PotCard title="Viikottain" amount="3000 €" icon="📅" color="border-blue-400/50 text-blue-300">
              Äänestys porukan kesken joka viikonloppu.
            </PotCard>
            <PotCard title="Kuukausittain" amount="5000 €" icon="📅" color="border-pink-400/50 text-pink-300">
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
                <div className="mt-1 text-xs font-black uppercase">{title}</div>
                <div className="mt-1 text-[11px] text-white/70">{text}</div>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-xl font-black">NÄIN PELI TOIMII <span className="rounded-full bg-white/10 px-2 text-sm">?</span></h2>

          <div className="flex gap-3 overflow-x-auto pb-2">
            <Step n="1" title="Kirjoita perustelu" text="Kerro miksi tarvitset rahaa."><Person type="blonde" /></Step>
            <Step n="2" title="Anna äänesi" text="Sinun ääni vaikuttaa."><Person type="woman" /></Step>
            <Step n="3" title="Tekoäly analysoi" text="AI valitsee parhaat."><Robot /></Step>
            <Step n="4" title="Yhteisö äänestää" text="Porukka ratkaisee."><div className="flex"><Person type="woman" /><Person type="man" /></div></Step>
            <Step n="5" title="Voittaja palkitaan" text="Voittaja saa rahapotin."><Person type="blonde" /></Step>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <GlassCard className="border-purple-400/40 p-4">
            <div className="text-4xl">👥</div>
            <h3 className="mt-2 text-sm font-black uppercase text-purple-300">Jaa peliä kavereillesi</h3>
            <p className="mt-2 text-xs text-white/70">Jokaisesta uudesta jäsenestä yhteisö kasvaa.</p>
          </GlassCard>

          <GlassCard className="border-green-400/40 p-4">
            <div className="text-4xl">📈</div>
            <h3 className="mt-2 text-sm font-black uppercase text-green-300">Älykäs todennäköisyys</h3>
            <p className="mt-2 text-xs text-white/70">Ranking elää äänten ja ajan mukana.</p>
            <div className="mt-2 text-4xl font-black text-green-300">3,2%</div>
          </GlassCard>

          <GlassCard className="border-blue-400/40 p-4">
            <div className="text-4xl">🛡️</div>
            <h3 className="mt-2 text-sm font-black uppercase text-blue-300">Reilut säännöt</h3>
            <p className="mt-2 text-xs text-white/70">Yksi ääni per käyttäjä.</p>
          </GlassCard>

          <GlassCard className="border-pink-400/40 p-4">
            <div className="text-4xl">💗</div>
            <h3 className="mt-2 text-sm font-black uppercase text-pink-300">Yhdessä rakennamme</h3>
            <p className="mt-2 text-xs text-white/70">Tämä on enemmän kuin peli.</p>
          </GlassCard>
        </section>

        <Link to="/feed" className="mt-5 flex items-center gap-4 rounded-[24px] border border-purple-400/40 bg-purple-500/20 p-4 shadow-2xl">
          <div className="grid h-20 w-28 place-items-center rounded-2xl bg-black/30 text-5xl">▶</div>
          <div className="flex-1">
            <h3 className="font-black">PUOLIVUOSITTAIN – SUURI POTTIJAKO!</h3>
            <p className="mt-1 text-sm text-white/70">Suuremman potin jako parhaiden perustelujen kesken.</p>
          </div>
          <div className="text-3xl">›</div>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
