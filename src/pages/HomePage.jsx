import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const characters = [
  { name: "Laura", role: "Yksinhuoltaja", avatar: "👩‍🦱", city: "Tampere" },
  { name: "Mikko", role: "Rakentaja", avatar: "🧔", city: "Oulu" },
  { name: "Sara", role: "Opiskelija", avatar: "👩‍🎓", city: "Helsinki" },
  { name: "Jari", role: "Isä", avatar: "👨‍👧", city: "Turku" },
  { name: "Aino", role: "Hoitaja", avatar: "👩‍⚕️", city: "Lahti" },
];

function PotCard({ title, amount, text, icon, color }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] border p-6 shadow-2xl ${color}`}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-sm font-black uppercase tracking-wider text-white/80">
            {title}
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            {icon}
          </div>
        </div>

        <div className="mt-4 text-5xl font-black">{amount}</div>
        <p className="mt-3 text-sm font-semibold text-white/75">{text}</p>
      </div>
    </div>
  );
}

function StepCard({ number, title, text, emoji }) {
  return (
    <div className="relative rounded-[28px] border border-white/10 bg-white/10 p-4 shadow-xl">
      <div className="absolute -top-3 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-sm font-black">
        {number}
      </div>

      <div className="mt-5 text-4xl">{emoji}</div>
      <h3 className="mt-3 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm text-white/65">{text}</p>
    </div>
  );
}

function MiniPhone({ title, children }) {
  return (
    <div className="rounded-[34px] border border-white/20 bg-white p-3 text-slate-950 shadow-2xl">
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-100 px-3 py-2">
        <div className="text-xs font-black">{title}</div>
        <div className="h-6 w-6 rounded-full bg-cyan-400" />
      </div>
      {children}
    </div>
  );
}

export default function HomePage() {
  const [topPosts, setTopPosts] = useState([]);

  useEffect(() => {
    loadTopPosts();
  }, []);

  async function loadTopPosts() {
    const groupId = localStorage.getItem("kolehti_group_id");

    let postsQuery = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    let votesQuery = supabase.from("votes").select("*");

    if (groupId) {
      postsQuery = postsQuery.eq("group_id", groupId);
      votesQuery = votesQuery.eq("group_id", groupId);
    }

    const { data: postsData } = await postsQuery;
    const { data: votesData } = await votesQuery;

    const votes = votesData || [];
    const posts = postsData || [];

    const counts = {};
    votes.forEach((vote) => {
      counts[vote.post_id] = (counts[vote.post_id] || 0) + 1;
    });

    const ranked = posts
      .map((post) => ({
        ...post,
        vote_count: counts[post.id] || 0,
      }))
      .sort((a, b) => b.vote_count - a.vote_count)
      .slice(0, 3);

    setTopPosts(ranked);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#061024] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-8%] top-[-10%] h-[420px] w-[420px] rounded-full bg-cyan-400/30 blur-[130px]" />
        <div className="absolute right-[-8%] top-[10%] h-[420px] w-[420px] rounded-full bg-fuchsia-500/25 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[25%] h-[520px] w-[520px] rounded-full bg-emerald-400/20 blur-[160px]" />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="relative overflow-hidden rounded-[42px] border border-white/10 bg-gradient-to-br from-sky-500/30 via-blue-900/40 to-purple-900/40 p-6 shadow-2xl md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-white text-5xl shadow-2xl">
                  🤝
                </div>

                <div>
                  <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                    KOLEHTI
                  </h1>
                  <p className="mt-1 font-bold text-white/80">
                    Yhdessä voimme. Porukka pitää huolta. 💙
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[34px] border border-white/10 bg-black/20 p-6 shadow-2xl backdrop-blur-xl">
                <div className="inline-flex rounded-full bg-cyan-400/20 px-4 py-2 text-sm font-black text-cyan-100">
                  AI-powered persuasion arena
                </div>

                <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                  Kirjoita perustelu. Vaikuta ihmisiin. Nouse kärkeen.
                </h2>

                <p className="mt-4 max-w-2xl text-lg font-semibold text-white/75">
                  Kolehti yhdistää yhteisön tuen, tekoälyn ja kilpailullisen näkyvyyden yhdeksi eläväksi kokemukseksi.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/groups"
                    className="rounded-2xl bg-cyan-500 px-6 py-4 font-black shadow-xl shadow-cyan-500/25"
                  >
                    Aloita porukasta
                  </Link>

                  <Link
                    to="/new"
                    className="rounded-2xl bg-pink-500 px-6 py-4 font-black shadow-xl shadow-pink-500/25"
                  >
                    Kirjoita perustelu
                  </Link>

                  <Link
                    to="/feed"
                    className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 font-black"
                  >
                    Avaa ranking
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid content-start gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[28px] border border-cyan-300/30 bg-cyan-400/15 p-5 shadow-xl">
                  <div className="text-sm font-black tracking-widest text-cyan-100">
                    PORUKAN KOKO
                  </div>
                  <div className="mt-2 text-4xl font-black">~1400</div>
                  <div className="text-sm text-white/65">jäsentä</div>
                </div>

                <div className="rounded-[28px] border border-purple-300/30 bg-purple-400/15 p-5 shadow-xl">
                  <div className="text-sm font-black tracking-widest text-purple-100">
                    SUOMI
                  </div>
                  <div className="mt-2 text-4xl font-black">FI</div>
                  <div className="text-sm text-white/65">ympäri maata</div>
                </div>

                <div className="rounded-[28px] border border-emerald-300/30 bg-emerald-400/15 p-5 shadow-xl">
                  <div className="text-sm font-black tracking-widest text-emerald-100">
                    TAVOITE
                  </div>
                  <div className="mt-2 text-4xl font-black">💙</div>
                  <div className="text-sm text-white/65">huolenpito</div>
                </div>
              </div>

              <div className="rounded-[34px] border border-white/10 bg-white/10 p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-black">Tänään mukana</h3>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
                    Live
                  </div>
                </div>

                <div className="grid gap-3">
                  {characters.map((person) => (
                    <div
                      key={person.name}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                        {person.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-black">{person.name}</div>
                        <div className="text-sm text-white/55">
                          {person.role} · {person.city}
                        </div>
                      </div>
                      <div className="text-pink-300">♥</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-3 flex items-center gap-2 px-2">
              <h2 className="text-2xl font-black">RAHAPOTIT</h2>
              <div className="rounded-full bg-white/10 px-2 py-1 text-xs font-black">
                ?
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <PotCard
                title="Päivittäin"
                amount="1000 €"
                icon="📅"
                text="Tekoälyn suorittama jako lähetettyjen perustelujen perusteella."
                color="border-emerald-300/40 bg-emerald-500/20"
              />

              <PotCard
                title="Viikoittain"
                amount="3000 €"
                icon="👥"
                text="Äänestys porukan kesken joka viikonloppu."
                color="border-cyan-300/40 bg-cyan-500/20"
              />

              <PotCard
                title="Kuukausittain"
                amount="5000 €"
                icon="👑"
                text="Äänestys porukan kesken kuukauden lopussa."
                color="border-fuchsia-300/40 bg-fuchsia-500/20"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-[28px] border border-yellow-300/40 bg-yellow-500/20 p-5 shadow-xl">
                <div className="text-4xl">🪙</div>
                <div className="mt-2 text-2xl font-black">1 € / päivä</div>
                <p className="mt-1 text-sm text-white/65">Kuukauden kesto 30 €</p>
              </div>

              <div className="rounded-[28px] border border-cyan-300/40 bg-cyan-500/20 p-5 shadow-xl">
                <div className="text-4xl">🧩</div>
                <div className="mt-2 text-2xl font-black">5 €</div>
                <p className="mt-1 text-sm text-white/65">Osallistu päiväpottiin</p>
              </div>

              <div className="rounded-[28px] border border-pink-300/40 bg-pink-500/20 p-5 shadow-xl">
                <div className="text-4xl">🎥</div>
                <div className="mt-2 text-2xl font-black">2 €</div>
                <p className="mt-1 text-sm text-white/65">Video perustelu</p>
              </div>

              <div className="rounded-[28px] border border-orange-300/40 bg-orange-500/20 p-5 shadow-xl">
                <div className="text-4xl">🚀</div>
                <div className="mt-2 text-2xl font-black">Boostit</div>
                <p className="mt-1 text-sm text-white/65">Korosta perusteluasi</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[34px] border border-white/10 bg-white/10 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black">🔥 Tänään TOP 3</h3>
              <Link to="/feed" className="text-sm font-bold text-cyan-200">
                Avaa
              </Link>
            </div>

            <div className="space-y-3">
              {topPosts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
                  Ei vielä postauksia näkyvissä.
                </div>
              ) : (
                topPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="text-2xl font-black text-cyan-200">
                      {index + 1}.
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                      {characters[index]?.avatar || "🙂"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-black">
                        {post.content || "Perustelu"}
                      </div>
                      <div className="text-sm text-pink-200">
                        ♥ {post.vote_count || 0}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              to="/feed"
              className="mt-4 block rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center font-black"
            >
              Näytä lisää
            </Link>
          </aside>
        </section>

        <section className="mt-6 rounded-[42px] border border-white/10 bg-white/10 p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black">NÄIN PELI TOIMII</h2>
              <p className="mt-1 text-white/60">
                Selkeä matka perustelusta porukan päätökseen.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <StepCard
              number="1"
              emoji="📱"
              title="Kirjoita perustelu"
              text="Kerro miksi juuri sinä tarvitset apua."
            />
            <StepCard
              number="2"
              emoji="💚"
              title="Anna äänesi"
              text="Sinun äänesi vaikuttaa rankingin järjestykseen."
            />
            <StepCard
              number="3"
              emoji="🤖"
              title="AI analysoi"
              text="Tekoäly auttaa nostamaan selkeyttä ja uskottavuutta."
            />
            <StepCard
              number="4"
              emoji="👥"
              title="Yhteisö reagoi"
              text="Porukka päättää ketkä nousevat kärkeen."
            />
            <StepCard
              number="5"
              emoji="🏆"
              title="Voittaja palkitaan"
              text="Paras perustelu saa näkyvyyttä ja tukea."
            />
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-[34px] border border-purple-300/30 bg-purple-500/20 p-6 shadow-2xl">
            <div className="text-4xl">📣</div>
            <h3 className="mt-3 text-2xl font-black">Jaa peliä kavereille</h3>
            <p className="mt-2 text-white/65">
              Jokaisesta rekisteröityneestä uudesta jäsenestä kasvaa yhteisön aktiivisuus.
            </p>
          </div>

          <div className="rounded-[34px] border border-emerald-300/30 bg-emerald-500/20 p-6 shadow-2xl">
            <div className="text-4xl">📈</div>
            <h3 className="mt-3 text-2xl font-black">Älykäs todennäköisyys</h3>
            <p className="mt-2 text-white/65">
              Mitä paremmin perustelu resonoi, sitä paremmin se nousee.
            </p>
            <div className="mt-4 text-5xl font-black text-emerald-200">3,2%</div>
          </div>

          <div className="rounded-[34px] border border-pink-300/30 bg-pink-500/20 p-6 shadow-2xl">
            <div className="text-4xl">💗</div>
            <h3 className="mt-3 text-2xl font-black">Yhdessä rakennamme</h3>
            <p className="mt-2 text-white/65">
              Tämä on enemmän kuin peli — tämä on yhteisö.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[42px] border border-white/10 bg-gradient-to-r from-purple-600/30 via-pink-500/20 to-orange-500/20 p-6 shadow-2xl">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full bg-red-500 px-4 py-2 text-sm font-black">
                🔥 LIVE
              </div>
              <h2 className="mt-4 text-3xl font-black">
                Puolivuosittain — suuri pottijako!
              </h2>
              <p className="mt-2 text-white/70">
                Suuremman potin jako parhaiden perustelujen kesken suoraan stream-lähetyksessä.
              </p>
            </div>

            <Link
              to="/feed"
              className="rounded-3xl bg-pink-500 px-6 py-5 text-center text-xl font-black shadow-xl shadow-pink-500/20"
            >
              Katso lähetys →
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <MiniPhone title="KOTI">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-200 to-blue-200 p-4">
              <div className="text-sm font-black">Porukka pitää huolta.</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/70 p-2">~1400 jäsentä</div>
                <div className="rounded-xl bg-white/70 p-2">Suomi</div>
              </div>
            </div>
          </MiniPhone>

          <MiniPhone title="FEED">
            <div className="space-y-2">
              <div className="rounded-2xl bg-slate-100 p-3">
                <div className="font-black">Laura, 35</div>
                <p className="text-xs">Tarvitsen apua vuokraan...</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3">
                <div className="font-black">Mikko, 38</div>
                <p className="text-xs">Olen ollut työttömänä...</p>
              </div>
            </div>
          </MiniPhone>

          <MiniPhone title="ÄÄNESTÄ">
            <div className="rounded-2xl bg-pink-100 p-4 text-center">
              <div className="text-5xl">👩‍🦱</div>
              <div className="mt-2 font-black">Laura, 35</div>
              <p className="text-xs">Äänestä swipe-tyylillä</p>
              <div className="mt-4 flex justify-center gap-3 text-3xl">
                ❌ 💚
              </div>
            </div>
          </MiniPhone>

          <MiniPhone title="PROFIILI">
            <div className="rounded-2xl bg-slate-100 p-4">
              <div className="text-4xl">🙂</div>
              <div className="mt-2 font-black">Tuomas, 29</div>
              <div className="mt-3 h-3 rounded-full bg-slate-200">
                <div className="h-3 w-2/3 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div>128</div>
                <div>2</div>
                <div>47</div>
              </div>
            </div>
          </MiniPhone>
        </section>
      </main>

      <footer className="mx-auto mt-6 max-w-7xl px-4 pb-6">
        <div className="grid gap-3 rounded-[34px] border border-white/10 bg-white/90 p-4 text-slate-900 shadow-2xl md:grid-cols-5">
          <div className="rounded-2xl bg-white p-3 text-center font-black">
            💙 Luottamus
          </div>
          <div className="rounded-2xl bg-white p-3 text-center font-black">
            👥 Yhteisö
          </div>
          <div className="rounded-2xl bg-white p-3 text-center font-black">
            🛡️ Vastuu
          </div>
          <div className="rounded-2xl bg-white p-3 text-center font-black">
            ⚖️ Reiluus
          </div>
          <div className="rounded-2xl bg-white p-3 text-center font-black">
            🌱 Toivo
          </div>
        </div>
      </footer>
    </div>
  );
}
