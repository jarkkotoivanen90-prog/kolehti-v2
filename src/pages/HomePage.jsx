import { Link } from "react-router-dom";

const heroPeople = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jari",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aino",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Mikko",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Laura",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Kari",
];

function InfoCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-2 text-xs font-black uppercase text-blue-700">{title}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-700">{text}</p>
      <div className="mt-3 text-right text-xl text-slate-400">›</div>
    </div>
  );
}

function PotCard({ title, amount, icon, color, text }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xs font-black uppercase">{title}</h3>
          <div className="mt-2 text-4xl font-black">{amount}</div>
        </div>
        <div className="rounded-full bg-white p-3 text-3xl shadow-md">{icon}</div>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{text}</p>
    </div>
  );
}

function Step({ n, img, title, text }) {
  return (
    <div className="min-w-[120px] flex-1">
      <div className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm">
        <img src={img} className="h-24 w-full object-cover" />
        <div className="absolute bottom-1 left-1 grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
          {n}
        </div>
      </div>
      <h4 className="mt-2 text-xs font-black uppercase text-blue-700">{title}</h4>
      <p className="mt-1 text-xs font-semibold text-slate-700">{text}</p>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2 text-center text-xs font-bold text-slate-600">
        <Link to="/" className="text-blue-600">🏠<div>Koti</div></Link>
        <Link to="/feed">📋<div>Perustelut</div></Link>
        <Link to="/new" className="-mt-7">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-3xl text-white shadow-xl">+</div>
          <div>Uusi</div>
        </Link>
        <Link to="/feed">👥<div>Äänestä</div></Link>
        <Link to="/profile">👤<div>Profiili</div></Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-950">
      <main className="mx-auto max-w-md px-4 py-4">
        <header className="flex items-center justify-between">
          <button className="text-4xl text-slate-700">☰</button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="text-4xl">🤝</div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">KOLEHTI</h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-600">
              Me pidämme huolta – yhdessä voitamme.
            </p>
          </div>

          <Link to="/profile" className="relative">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-200 text-2xl shadow">
              👨
            </div>
            <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
              3
            </span>
          </Link>
        </header>

        <section className="mt-4 overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
          <div className="relative h-56">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-orange-100 to-blue-500" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-[-8px] px-2">
              {heroPeople.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  className={`h-40 w-24 object-contain drop-shadow-xl ${i === 2 ? "h-48" : ""}`}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <h2 className="text-2xl font-black leading-tight">
                Porukka pitää huolta.
                <br />
                Yhdessä voimme.
              </h2>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-3 gap-2">
          <InfoCard
            icon="👥"
            title="Porukan koko"
            text="~1400 jäsentä. Porukoita tulee lisää kun jäsenmäärät kasvavat."
          />
          <InfoCard
            icon="🗺️"
            title="Jäsenet ympäri Suomea"
            text="Porukoiden nimet ovat oikeita, mutta jäsenet sekoitetaan."
          />
          <InfoCard
            icon="💚"
            title="Tavoitteemme"
            text="Yhteisöllisyys ja huolenpito. Pidämme huolta heikoimmista."
          />
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">RAHAPOTIT</h2>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-xs font-black">?</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <PotCard
              title="Päivittäin"
              amount="1000 €"
              icon="📅"
              color="border-emerald-100 text-emerald-700"
              text="AI analysoi ja palkitsee parhaan perustelun."
            />
            <PotCard
              title="Viikottain"
              amount="3000 €"
              icon="📅"
              color="border-blue-100 text-blue-700"
              text="Eniten ääniä saanut perustelu voittaa."
            />
            <PotCard
              title="Kuukausittain"
              amount="5000 €"
              icon="📅"
              color="border-purple-100 text-purple-700"
              text="Kuukauden lopussa suurin potti."
            />
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              ["🪙", "1 € / päivä", "Kuukauden kesto 30 €"],
              ["🎟️", "Osallistu", "Päiväpottiin 5 €"],
              ["🎥", "Video", "Perustelu 2 €"],
              ["🚀", "Boostit", "Näkyvyys kasvaa"],
            ].map(([icon, title, text]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-3xl">{icon}</div>
                <div className="mt-1 text-xs font-black uppercase">{title}</div>
                <div className="mt-1 text-[11px] font-semibold text-slate-600">{text}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">NÄIN PELI TOIMII</h2>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-xs font-black">?</span>
          </div>

          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            <Step
              n="1"
              img="https://api.dicebear.com/7.x/adventurer/svg?seed=phone1"
              title="Kirjoita perustelu"
              text="Kerro miksi juuri sinä tarvitset rahaa."
            />
            <Step
              n="2"
              img="https://api.dicebear.com/7.x/adventurer/svg?seed=phone2"
              title="Anna äänesi"
              text="Sinun äänesi vaikuttaa voittajan valintaan."
            />
            <Step
              n="3"
              img="https://api.dicebear.com/7.x/bottts/svg?seed=kai"
              title="Tekoäly analysoi"
              text="AI käy kaikki perustelut läpi."
            />
            <Step
              n="4"
              img="https://api.dicebear.com/7.x/adventurer/svg?seed=team"
              title="Yhteisö äänestää"
              text="Porukka ratkaisee järjestyksen."
            />
            <Step
              n="5"
              img="https://api.dicebear.com/7.x/adventurer/svg?seed=winner"
              title="Voittaja palkitaan"
              text="Voittaja saa rahapotin."
            />
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          {[
            ["💜", "Jaa peliä kavereillesi", "Jokaisesta uudesta jäsenestä yhteisö kasvaa."],
            ["📈", "Älykäs todennäköisyys", "Jos olet saanut 1000 € jo kerran, mahdollisuudet muuttuvat."],
            ["🛡️", "Reilut säännöt", "Boosteilla voi ostaa näkyvyyttä, ei voittoa."],
            ["💗", "Yhdessä rakennamme", "Tämä on enemmän kuin peli — tämä on yhteisö."],
          ].map(([icon, title, text]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-4xl">{icon}</div>
              <h3 className="mt-2 text-sm font-black uppercase text-blue-700">{title}</h3>
              <p className="mt-2 text-xs font-semibold text-slate-600">{text}</p>
            </div>
          ))}
        </section>

        <Link
          to="/feed"
          className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="h-20 w-28 overflow-hidden rounded-xl bg-slate-200">
            <img
              src="https://api.dicebear.com/7.x/adventurer/svg?seed=stream"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-black">PUOLIVUOSITTAIN – SUURI POTTIJAKO!</h3>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Suuremman potin jako parhaiden perustelujen kesken.
            </p>
          </div>
          <div className="text-3xl text-blue-600">›</div>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
