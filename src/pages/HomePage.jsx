import { Link } from "react-router-dom";

const koliBg = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85";

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[30px] border border-white/10 bg-[#061126]/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-black">
        <Link to="/" className="text-cyan-300">🏠<div>Koti</div></Link>
        <Link to="/feed">🔥<div>Feed</div></Link>
        <Link to="/new" className="-mt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">+</div>
          <div>Uusi</div>
        </Link>
        <Link to="/pots">🏆<div>Potit</div></Link>
        <Link to="/profile">👤<div>Profiili</div></Link>
      </div>
    </nav>
  );
}

function Rule({ n, icon, title, text }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500 text-lg font-black text-white">{n}</div>
        <div>
          <div className="text-2xl">{icon}</div>
          <h3 className="mt-1 text-base font-black leading-tight">{title}</h3>
          <p className="mt-1 text-[13px] font-bold leading-snug text-white/65">{text}</p>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, title, text }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-xl">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-2 text-lg font-black leading-tight">{title}</h3>
      <p className="mt-2 text-[13px] font-bold leading-snug text-white/65">{text}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050816] pb-32 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_42%,#02030a_100%)]" />

      <main className="mx-auto max-w-md px-4 py-5">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">KOLEHTI</h1>
            <p className="text-xs font-black uppercase text-white/55">Porukka pitää huolta</p>
          </div>
          <Link to="/profile" className="grid h-14 w-14 place-items-center rounded-3xl border border-white/10 bg-white/10 text-3xl shadow-xl">👤</Link>
        </header>

        <section
          className="relative min-h-[390px] overflow-hidden rounded-[38px] border border-cyan-300/25 shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(rgba(2,6,23,.08), rgba(2,6,23,.88)), url(${koliBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 flex min-h-[390px] flex-col justify-end p-5">
            <div className="mb-4 w-fit rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100 backdrop-blur-xl">
              🇫🇮 suomalainen yhteisöpeli
            </div>

            <div className="rounded-[32px] border border-yellow-300/25 bg-black/45 p-5 shadow-2xl backdrop-blur-xl">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-yellow-200">Tämän päivän kierros</div>
              <div className="mt-2 text-5xl font-black leading-none">Potti auki</div>
              <p className="mt-3 text-sm font-bold leading-snug text-white/70">
                Kirjoita yksi hyvä perustelu, kerää ääniä ja nouse mukaan kilpailuun.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link to="/new" className="rounded-3xl bg-cyan-500 px-5 py-4 text-center text-lg font-black shadow-2xl shadow-cyan-500/25">Luo perustelu</Link>
              <Link to="/feed" className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-center text-lg font-black backdrop-blur-xl">Katso feed</Link>
            </div>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-black/25 p-3 text-center"><div className="text-xl font-black">1 / vko</div><div className="text-[10px] font-black uppercase text-white/45">postaus</div></div>
          <div className="rounded-2xl bg-black/25 p-3 text-center"><div className="text-xl font-black">3 kk</div><div className="text-[10px] font-black uppercase text-white/45">finaali</div></div>
          <div className="rounded-2xl bg-black/25 p-3 text-center"><div className="text-xl font-black">Top 5</div><div className="text-[10px] font-black uppercase text-white/45">äänestys</div></div>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Säännöt heti selväksi</p>
              <h2 className="text-3xl font-black leading-none">Näin peli toimii</h2>
            </div>
            <Link to="/pots" className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/70">Potit →</Link>
          </div>

          <div className="grid gap-3">
            <Rule n="1" icon="✍️" title="Postaa kerran viikossa" text="Jokainen pelaaja voi osallistua yhdellä perustelulla viikossa, jotta kilpailu pysyy reiluna." />
            <Rule n="2" icon="💗" title="Kerää tykkäyksiä" text="Viikon eniten tykkäyksiä saanut perustelu voittaa viikkokierroksen. Sama pelaaja ei voita kahta viikkoa putkeen." />
            <Rule n="3" icon="💎" title="Päivä, viikko ja kuukausi" text="Kilpailutilanne näkyy Potit-sivulla. Kuukausivoittaja ratkaistaan tykkäyksillä." />
            <Rule n="4" icon="👑" title="Porukat finaaliin" text="Porukat ovat automaattisia. Suurimman XP:n porukka pääsee finaaliin, jossa top-5 pelaajasta äänestetään voittaja." />
          </div>
        </section>

        <section className="mt-7 grid grid-cols-2 gap-3">
          <StatusCard icon="🎟️" title="Päiväslot" text="Erillinen päiväslot voidaan avata myöhemmin maksupalvelun kautta." />
          <StatusCard icon="⚡" title="Boostit" text="Boostit korostavat perustelua, mutta eivät riko viikkokilpailun reiluutta." />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
