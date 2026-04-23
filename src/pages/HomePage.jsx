import { Link } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import PremiumButton from "../components/ui/PremiumButton";
import PremiumStat from "../components/ui/PremiumStat";
import { useFeed } from "../hooks/useFeed";

function Hero() {
  return (
    <section className="glass-card-strong p-5">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
          <div className="pill">AI-powered persuasion arena</div>

          <div className="mt-4 headline-xl max-w-3xl">
            Kirjoita perustelu. Vaikuta ihmisiin. Nouse kärkeen.
          </div>

          <div className="mt-3 max-w-2xl text-base text-white/75">
            Kolehti yhdistää yhteisön tuen, tekoälyn ja kilpailullisen näkyvyyden
            yhdeksi kokemukseksi.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/new">
              <PremiumButton variant="primary">Kirjoita perustelu</PremiumButton>
            </Link>

            <Link to="/vote">
              <PremiumButton variant="ghost">Äänestä swipeillä</PremiumButton>
            </Link>

            <Link
              to="/login"
              className="inline-flex rounded-2xl border border-white/12 bg-white/8 px-4 py-3 font-semibold text-white transition hover:bg-white/12"
            >
              Kirjaudu / Luo tili
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] p-5">
          <div className="section-title">Päivän fiilis</div>
          <div className="mt-2 headline-lg">
            Yhdessä voimme. Porukka pitää huolta.
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PremiumStat label="Porukan koko" value="~1400" tone="blue" />
            <PremiumStat label="Suomi" value="FI" tone="pink" />
            <PremiumStat label="Tavoite" value="💚" tone="green" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PotSection() {
  return (
    <section className="glass-card p-5">
      <SectionHeader
        eyebrow="Rahapotit"
        title="Kolme tasoa, yksi yhteisö"
        subtitle="Päivittäinen, viikoittainen ja kuukausittainen näkyvyys ja pottirakenne."
      />

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-5">
          <div className="text-sm font-bold text-emerald-200">Päivittäin</div>
          <div className="mt-3 text-4xl font-black tracking-tight text-white">
            1000 €
          </div>
          <div className="mt-2 text-sm text-white/70">
            Tekoälyn suorittama jako lähetettyjen perustelujen perusteella.
          </div>
        </div>

        <div className="rounded-[28px] border border-cyan-400/20 bg-cyan-500/10 p-5">
          <div className="text-sm font-bold text-cyan-200">Viikoittain</div>
          <div className="mt-3 text-4xl font-black tracking-tight text-white">
            3000 €
          </div>
          <div className="mt-2 text-sm text-white/70">
            Äänestys porukan kesken joka viikonloppu.
          </div>
        </div>

        <div className="rounded-[28px] border border-fuchsia-400/20 bg-fuchsia-500/10 p-5">
          <div className="text-sm font-bold text-fuchsia-200">Kuukausittain</div>
          <div className="mt-3 text-4xl font-black tracking-tight text-white">
            5000 €
          </div>
          <div className="mt-2 text-sm text-white/70">
            Äänestys porukan kesken kuukauden lopussa.
          </div>
        </div>
      </div>
    </section>
  );
}

function StepsSection() {
  const steps = [
    {
      id: "01",
      title: "Kirjoita perustelu",
      text: "Kerro miksi tarvitset tukea juuri nyt.",
    },
    {
      id: "02",
      title: "Äänestä",
      text: "Reagoi muiden perusteluihin ja osallistu yhteisön päätöksiin.",
    },
    {
      id: "03",
      title: "AI analysoi",
      text: "Tekoäly arvioi selkeyttä, uskottavuutta ja osuvuutta.",
    },
    {
      id: "04",
      title: "Yhteisö reagoi",
      text: "Äänet ja näkyvyys määrittävät nousun feedissä.",
    },
    {
      id: "05",
      title: "Voittaja selitetään",
      text: "Reason engine kertoo miksi juuri tämä perustelu nousi.",
    },
  ];

  return (
    <section className="glass-card p-5">
      <SectionHeader
        eyebrow="Näin toimii"
        title="Viisi askelta"
        subtitle="Selkeä rakenne, yhteisö ja näkyvyys samassa flowssa."
      />

      <div className="mt-5 grid gap-4 xl:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.id}
            className="rounded-[24px] border border-white/10 bg-white/6 p-4"
          >
            <div className="text-xs font-black tracking-[0.18em] text-cyan-200">
              {step.id}
            </div>
            <div className="mt-2 text-lg font-black text-white">{step.title}</div>
            <div className="mt-2 text-sm text-white/70">{step.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeedPreview() {
  const { posts = [], loading } = useFeed();

  return (
    <section className="glass-card p-5">
      <SectionHeader
        eyebrow="Feed preview"
        title="Tuoreita perusteluja"
        subtitle="Esikatselu siitä, mitä yhteisössä juuri nyt näkyy."
        right={
          <Link to="/feed">
            <PremiumButton variant="ghost">Avaa feed</PremiumButton>
          </Link>
        }
      />

      {loading ? (
        <div className="mt-5 text-white/70">Ladataan feediä...</div>
      ) : posts.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/6 p-4 text-white/70">
          Ei vielä postauksia näkyvissä.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {posts.slice(0, 4).map((post) => (
            <div
              key={post.id}
              className="rounded-[24px] border border-white/10 bg-white/6 p-4"
            >
              <div className="text-sm text-white/60">
                {post.profiles?.display_name || "Käyttäjä"}
              </div>

              <div className="mt-2 text-lg font-bold text-white">
                {post.title || "Perustelu"}
              </div>

              <div className="mt-2 line-clamp-3 text-sm text-white/75">
                {post.body}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-white/75">
                  ❤️ {post.votes ?? 0}
                </span>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-cyan-200">
                  AI {post.ai_score ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="space-y-6">
        <Hero />
        <PotSection />
        <StepsSection />
        <FeedPreview />
      </div>
    </div>
  );
}
