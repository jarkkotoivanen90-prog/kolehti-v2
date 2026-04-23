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
          <div className="mt-4 headline-xl max-w-3xl">Kirjoita perustelu. Vaikuta ihmisiin. Nouse kärkeen.</div>
          <div className="mt-3 max-w-2xl text-base text-white/75">Kolehti yhdistää yhteisön tuen, tekoälyn ja kilpailullisen näkyvyyden yhdeksi kokemukseksi.</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/new"><PremiumButton variant="primary">Kirjoita perustelu</PremiumButton></Link>
            <Link to="/vote"><PremiumButton variant="ghost">Äänestä swipella</PremiumButton></Link>
          </div>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
          <div className="section-title">Päivän fiilis</div>
          <div className="mt-2 headline-lg">Yhdessä voimme. Porukka pitää huolta.</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <PremiumStat label="Porukan koko" value="~1400" tone="blue" />
            <PremiumStat label="Suomi" value="FI" tone="pink" />
            <PremiumStat label="Tavoite" value="💚" tone="green" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Pots() {
  const pots = [
    ["Päivittäin", "1000 €", "Tekoälyn suorittama jako lähetettyjen perustelujen perusteella."],
    ["Viikoittain", "3000 €", "Äänestys porukan kesken joka viikonloppu."],
    ["Kuukausittain", "5000 €", "Äänestys porukan kesken kuukauden lopussa."],
  ];
  return (
    <section className="glass-card p-5">
      <SectionHeader eyebrow="Rahapotit" title="Kolme tasoa, yksi yhteisö" />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {pots.map(([title, amount, text], i) => (
          <div key={title} className={`rounded-[24px] p-[1px] ${["bg-gradient-to-br from-emerald-400 to-green-600","bg-gradient-to-br from-cyan-400 to-blue-600","bg-gradient-to-br from-fuchsia-400 to-pink-600"][i]}`}>
            <div className="rounded-[23px] bg-[rgba(10,14,30,0.78)] p-4 h-full">
              <div className="text-lg font-black">{title}</div>
              <div className="mt-2 text-4xl font-black">{amount}</div>
              <div className="mt-2 text-sm text-white/70">{text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { entries } = useFeed("day");
  const top = entries.slice(0, 3);

  return (
    <div className="space-y-6">
      <Hero />
      <Pots />
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-5">
          <SectionHeader eyebrow="Näin toimii" title="Viisi askelta" />
          <div className="mt-5 flex gap-3 overflow-x-auto xl:grid xl:grid-cols-5">
            {[
              "Kirjoita perustelu",
              "Äänestä",
              "AI analysoi",
              "Yhteisö reagoi",
              "Voittaja selitetään",
            ].map((step, i) => (
              <div key={step} className="min-w-[200px] rounded-[24px] border border-white/10 bg-white/6 p-4">
                <div className="text-xs font-black tracking-[0.18em] text-cyan-200">{String(i+1).padStart(2, "0")}</div>
                <div className="mt-2 font-black">{step}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <SectionHeader eyebrow="Live ranking" title="Tämän hetken top 3" />
          <div className="mt-5 space-y-3">
            {top.map((entry, idx) => (
              <div key={entry.id} className="rounded-2xl bg-white/6 p-4">
                <div className="text-sm text-white/60">#{idx + 1} • {entry.display_name}</div>
                <div className="mt-1 font-bold">{entry.title || "Perustelu"}</div>
                <div className="mt-2 text-sm text-white/70">❤️ {entry.votes} • AI {Number(entry.ai_score || 0).toFixed(2)}</div>
              </div>
            ))}
            {!top.length ? <div className="text-sm text-white/60">Ei vielä aktiivisia perusteluja.</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
