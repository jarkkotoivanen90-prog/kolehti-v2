import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import CharacterAvatar from "../components/CharacterAvatar";
import { characters, kaiCharacter } from "../data/characters";

function StatCard({ title, value, text, icon, color }) {
  return (
    <div className={`group relative overflow-hidden rounded-[30px] border p-5 shadow-2xl transition duration-300 hover:-translate-y-2 hover:scale-[1.02] ${color}`}>
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20 blur-3xl transition group-hover:scale-150" />
      <div className="relative">
        <div className="text-4xl">{icon}</div>
        <div className="mt-3 text-xs font-black uppercase tracking-widest text-white/70">{title}</div>
        <div className="mt-1 text-3xl font-black">{value}</div>
        <p className="mt-2 text-sm text-white/65">{text}</p>
      </div>
    </div>
  );
}

function PotCard({ title, amount, text, icon, color }) {
  return (
    <div className={`group relative overflow-hidden rounded-[34px] border p-6 shadow-2xl transition duration-300 hover:-translate-y-2 hover:scale-[1.02] ${color}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_35%)] opacity-0 transition group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-black uppercase tracking-widest text-white/70">{title}</div>
            <div className="mt-2 text-5xl font-black">{amount}</div>
          </div>
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-3xl shadow-xl">
            {icon}
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-white/70">{text}</p>
      </div>
    </div>
  );
}

function StepCard({ number, title, text, icon }) {
  return (
    <div className="group rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-xl transition duration-300 hover:-translate-y-2 hover:bg-white/15">
      <div className="flex items-center justify-between">
        <div className="text-xs font-black tracking-[0.25em] text-cyan-200">{number}</div>
        <div className="text-4xl transition duration-300 group-hover:scale-125">{icon}</div>
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm text-white/65">{text}</p>
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

    const counts = {};
    (votesData || []).forEach((vote) => {
      counts[vote.post_id] = (counts[vote.post_id] || 0) + 1;
    });

    const ranked = (postsData || [])
      .map((post) => ({
        ...post,
        vote_count: counts[post.id] || 0,
      }))
      .sort((a, b) => b.vote_count - a.vote_count)
      .slice(0, 3);

    setTopPosts(ranked);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <style>{`
        @keyframes floaty {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(34,211,238,.18); }
          50% { box-shadow: 0 0 80px rgba(34,211,238,.42); }
        }
        @keyframes shine {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        .floaty { animation: floaty 4s ease-in-out infinite; }
        .pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }
        .shine:before {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-120%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
          animation: shine 4s infinite;
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050816]" />
        <div className="absolute left-[-10%] top-[-10%] h-[520px] w-[520px] rounded-full bg-cyan-500/30 blur-[150px]" />
        <div className="absolute right-[-10%] top-[10%] h-[520px] w-[520px] rounded-full bg-fuchsia-500/25 blur-[150px]" />
        <div className="absolute bottom-[-15%] left-[20%] h-[560px] w-[560px] rounded-full bg-emerald-500/20 blur-[170px]" />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="shine relative overflow-hidden rounded-[46px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_35%)]" />

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
                AI-powered persuasion arena
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="pulse-glow grid h-20 w-20 place-items-center rounded-[28px] bg-cyan-500 text-5xl shadow-2xl">
                  🤝
                </div>

                <div>
                  <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                    KOLEHTI
                  </h1>
                  <p className="mt-1 font-bold text-white/70">
                    Yhdessä voimme. Porukka pitää huolta.
                  </p>
                </div>
              </div>

              <h2 className="mt-8 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Kirjoita perustelu. Vaikuta ihmisiin. Nouse kärkeen.
              </h2>

              <p className="mt-5 max-w-2xl text-lg font-semibold text-white/70">
                Yhteisöllinen peli, jossa porukka, tekoäly ja äänestys nostavat tärkeimmät perustelut näkyviin.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/groups" className="rounded-2xl bg-cyan-500 px-6 py-4 font-black shadow-xl shadow-cyan-500/25 transition hover:-translate-y-1 hover:scale-105">
                  Aloita porukasta
                </Link>

                <Link to="/new" className="rounded-2xl bg-pink-500 px-6 py-4 font-black shadow-xl shadow-pink-500/25 transition hover:-translate-y-1 hover:scale-105">
                  Kirjoita perustelu
                </Link>

                <Link to="/feed" className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 font-black transition hover:-translate-y-1 hover:bg-white/20">
                  Avaa ranking
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {characters.slice(0, 4).map((character, index) => (
                  <div
                    key={character.id}
                    className="floaty rounded-[34px] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl"
                    style={{ animationDelay: `${index * 0.35}s` }}
                  >
                    <CharacterAvatar character={character} size="lg" />
                  </div>
                ))}
              </div>

              <div className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 rounded-[28px] border border-white/10 bg-black/50 p-4 shadow-2xl backdrop-blur-xl md:block">
                <div className="flex items-center gap-3">
                  <CharacterAvatar character={kaiCharacter} size="sm" showInfo={false} />
                  <div>
                    <div className="text-sm font-bold text-cyan-200">KAI-avustaja</div>
                    <div className="mt-1 text-sm text-white/70">
                      “Autan nostamaan parhaat perustelut näkyviin.”
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard
            icon="👥"
            title="Porukan koko"
            value="~1400"
            text="Porukoita tulee lisää jäsenmäärien kasvaessa."
            color="border-cyan-300/30 bg-cyan-500/15"
          />

          <StatCard
            icon="🇫🇮"
            title="Jäsenet ympäri Suomea"
            value="FI"
            text="Porukoiden nimet ovat oikeita, jäsenet sekoitetaan."
            color="border-purple-300/30 bg-purple-500/15"
          />

          <StatCard
            icon="💙"
            title="Tavoite"
            value="Huolenpito"
            text="Pidämme huolta huonoiten menevistä jäsenistä."
            color="border-emerald-300/30 bg-emerald-500/15"
          />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_330px]">
          <div>
            <h2 className="mb-4 text-2xl font-black">RAHAPOTIT</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <PotCard
                title="Päivittäin"
                amount="1000 €"
                icon="📅"
                text="Tekoäly analysoi ja nostaa vahvimman perustelun."
                color="border-emerald-300/30 bg-emerald-500/20"
              />
              <PotCard
                title="Viikoittain"
                amount="3000 €"
                icon="👥"
                text="Äänestys porukan kesken viikonlopun lopussa."
                color="border-cyan-300/30 bg-cyan-500/20"
              />
              <PotCard
                title="Kuukausittain"
                amount="5000 €"
                icon="👑"
                text="Kuukauden vahvin perustelu nousee kärkeen."
                color="border-fuchsia-300/30 bg-fuchsia-500/20"
              />
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
                  <div key={post.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center gap-3">
                      <CharacterAvatar
                        character={characters[index] || characters[0]}
                        size="sm"
                        showInfo={false}
                        rank={index + 1}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-black">{post.content || "Perustelu"}</div>
                        <div className="text-sm text-pink-200">♥ {post.vote_count || 0}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-[42px] border border-white/10 bg-white/10 p-6 shadow-2xl">
          <h2 className="text-3xl font-black">NÄIN PELI TOIMII</h2>
          <p className="mt-1 text-white/60">Selkeä matka perustelusta porukan päätökseen.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <StepCard number="01" icon="📱" title="Kirjoita" text="Kerro miksi tarvitset tukea." />
            <StepCard number="02" icon="💚" title="Äänestä" text="Anna ääni parhaalle perustelulle." />
            <StepCard number="03" icon="🤖" title="AI analysoi" text="Selkeys ja uskottavuus korostuvat." />
            <StepCard number="04" icon="👥" title="Yhteisö reagoi" text="Porukka nostaa parhaat esiin." />
            <StepCard number="05" icon="🏆" title="Voittaja" text="Vahvin perustelu palkitaan." />
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[30px] border border-purple-300/30 bg-purple-500/20 p-6 shadow-2xl transition hover:-translate-y-2">
            <div className="text-4xl">📣</div>
            <h3 className="mt-3 text-xl font-black">Jaa peliä</h3>
            <p className="mt-2 text-sm text-white/65">Yhteisö kasvaa, kun kutsut kavereita mukaan.</p>
          </div>

          <div className="rounded-[30px] border border-emerald-300/30 bg-emerald-500/20 p-6 shadow-2xl transition hover:-translate-y-2">
            <div className="text-4xl">📈</div>
            <h3 className="mt-3 text-xl font-black">Todennäköisyys</h3>
            <p className="mt-2 text-sm text-white/65">Ranking elää äänten ja ajankohdan mukana.</p>
          </div>

          <div className="rounded-[30px] border border-cyan-300/30 bg-cyan-500/20 p-6 shadow-2xl transition hover:-translate-y-2">
            <div className="text-4xl">🛡️</div>
            <h3 className="mt-3 text-xl font-black">Reiluus</h3>
            <p className="mt-2 text-sm text-white/65">Yksi ääni per käyttäjä pitää kilpailun selkeänä.</p>
          </div>

          <div className="rounded-[30px] border border-pink-300/30 bg-pink-500/20 p-6 shadow-2xl transition hover:-translate-y-2">
            <div className="text-4xl">💗</div>
            <h3 className="mt-3 text-xl font-black">Yhteisö</h3>
            <p className="mt-2 text-sm text-white/65">Tämä on enemmän kuin peli — tämä on porukka.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
