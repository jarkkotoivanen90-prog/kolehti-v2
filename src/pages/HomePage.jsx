import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const IMG = {
  helsinki: "/finland/helsinki.svg",
  slogan: "/finland/lake.svg",
  lake: "/finland/lake.svg",
  forest: "/finland/forest.svg",
  lapland: "/finland/forest.svg",
  road: "/finland/forest.svg",
  archipelago: "/finland/lake.svg",
};

const slogans = [
  ["⚡", "KILPAILE. ÄÄNESTÄ. NOUSE.", "Joka ääni vie sinua lähemmäs pottia."],
  ["🔥", "PÄIVÄN POTTI ELÄÄ.", "Katselut, jaot ja tykkäykset nostavat kierrosta."],
  ["👥", "PORUKKA RATKAISEE.", "Yhdessä kerätty XP vie kohti finaalia."],
  ["🏆", "TOP 5 MENEE FINAALIIN.", "Nouse leaderboardissa ennen kierroksen sulkeutumista."],
];

function Tap({ children, className = "", to = "/" }) {
  return (
    <Link to={to} onClick={() => navigator.vibrate?.(8)} className={className}>
      {children}
    </Link>
  );
}

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-16 w-16 place-items-center rounded-[26px] bg-gradient-to-br from-cyan-200 via-teal-300 to-blue-700 shadow-2xl shadow-cyan-400/30">
        <div className="absolute -inset-1 rounded-[30px] bg-cyan-300/15 blur-lg" />
        <svg viewBox="0 0 120 120" className="relative h-12 w-12 drop-shadow-[0_0_14px_rgba(34,211,238,.85)]">
          <defs>
            <linearGradient id="heartLogo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="60%" stopColor="#dffbff" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
          </defs>
          <path d="M60 103C48 89 12 72 12 45c0-14 10-24 23-24 11 0 19 7 25 17 6-10 14-17 25-17 13 0 23 10 23 24 0 27-36 44-48 58Z" fill="url(#heartLogo)" />
          <path d="M38 31h17v28l28-28h23L76 60l33 37H84L55 64v33H38V31Z" fill="#031126" opacity=".96" />
          <path d="M53 31v28l29-28h13L66 59l31 38H84L53 62v35H44V31h9Z" fill="url(#heartLogo)" />
        </svg>
      </div>
      <div>
        <h1 className="text-[40px] font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-yellow-200">KOLEHTI</h1>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.25em] text-cyan-200/75">Kilpaile. Auta. Nouse.</p>
      </div>
    </div>
  );
}

function HeroCard() {
  return (
    <section className="relative mt-5 overflow-hidden rounded-[34px] border border-cyan-300/25 shadow-2xl">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.18), rgba(2,6,23,.42), rgba(2,6,23,.88)), url(${IMG.helsinki})` }} />
      <div className="relative min-h-[340px] p-5">
        <div className="w-fit rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100 backdrop-blur-md">🇫🇮 Suomalainen yhteisöpeli</div>
        <div className="mt-14 max-w-[90%]">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Tämän päivän kierros</p>
          <h2 className="mt-3 text-[52px] font-black leading-[0.95] tracking-tight text-white">POTTI<br />AUKI!</h2>
          <p className="mt-5 text-[16px] font-black leading-snug text-white/85">Kirjoita perustelu, kerää ääniä ja nouse mukaan kilpailuun.</p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Tap to="/new" className="rounded-[26px] bg-cyan-500 px-4 py-4 text-center text-base font-black uppercase text-white shadow-2xl shadow-cyan-500/25 active:scale-[0.98]">Luo perustelu</Tap>
          <Tap to="/feed" className="rounded-[26px] border border-white/20 bg-black/30 px-4 py-4 text-center text-base font-black uppercase text-white backdrop-blur-md active:scale-[0.98]">Katso feed</Tap>
        </div>
      </div>
    </section>
  );
}

function SloganCard({ slogan }) {
  return (
    <section className="relative mt-5 overflow-hidden rounded-[26px] border border-cyan-300/20 p-4 shadow-xl">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.55), rgba(2,6,23,.86)), url(${IMG.slogan})` }} />
      <div className="relative flex items-center gap-4">
        <div className="text-4xl">{slogan[0]}</div>
        <div>
          <div className="text-[20px] font-black leading-tight text-white">{slogan[1]}</div>
          <div className="mt-1 text-sm font-bold text-white/72">{slogan[2]}</div>
        </div>
      </div>
    </section>
  );
}

function RuleCard({ n, icon, title, text, image }) {
  return (
    <div className="relative min-h-[210px] overflow-hidden rounded-[28px] border border-white/10 p-4 shadow-xl">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(2,6,23,.22), rgba(2,6,23,.9)), url(${image})` }} />
      <div className="relative flex min-h-[178px] flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500 text-xl font-black text-white shadow-lg shadow-cyan-500/30">{n}</div>
          <div className="text-3xl">{icon}</div>
        </div>
        <div>
          <h3 className="text-[20px] font-black leading-tight text-white">{title}</h3>
          <p className="mt-2 text-[12px] font-bold leading-snug text-white/72">{text}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, text, footerLeft, footerRight, image, to, progress }) {
  return (
    <Tap to={to} className="relative block min-h-[236px] overflow-hidden rounded-[30px] border border-white/10 p-4 shadow-2xl active:scale-[0.98]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(2,6,23,.2), rgba(2,6,23,.92)), url(${image})` }} />
      <div className="relative flex min-h-[204px] flex-col">
        <p className="text-[12px] font-black uppercase tracking-wide text-cyan-200">{title}</p>
        <div className="mt-3 text-5xl leading-none">{icon}</div>
        <div className="mt-1 truncate text-[42px] font-black leading-none text-white">{value}</div>
        <p className="mt-3 min-h-[34px] text-[13px] font-bold leading-snug text-white/76">{text}</p>
        <div className="mt-auto h-3 overflow-hidden rounded-full bg-black/45">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${Math.max(8, Math.min(100, progress))}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-black text-white/82">
          <span className="truncate">{footerLeft}</span>
          <span className="truncate text-right">{footerRight}</span>
        </div>
      </div>
    </Tap>
  );
}

function BottomNav() {
  const location = useLocation();
  const items = [
    { to: "/", icon: "⌂", label: "Koti" },
    { to: "/feed", icon: "🔥", label: "Feed", badge: "LIVE" },
    { to: "/new", icon: "+", label: "Uusi", fab: true },
    { to: "/pots", icon: "🏆", label: "Potit", badge: "HOT" },
    { to: "/profile", icon: "●", label: "Profiili" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md px-5 pb-4 text-white">
      <div className="relative rounded-[40px] border border-cyan-300/25 bg-[#061126]/95 px-4 pb-5 pt-4 shadow-2xl shadow-cyan-500/15 backdrop-blur-2xl">
        <div className="grid grid-cols-5 items-end text-center text-[12px] font-black">
          {items.map((item) => {
            const active = location.pathname === item.to;
            if (item.fab) {
              return (
                <Tap key={item.to} to={item.to} className="-mt-12 flex flex-col items-center">
                  <div className="grid h-[86px] w-[86px] place-items-center rounded-full border-[6px] border-[#061126] bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-600 text-[62px] font-black leading-none shadow-2xl shadow-cyan-400/40">+</div>
                  <div className="mt-1 text-white">{item.label}</div>
                </Tap>
              );
            }
            return (
              <Tap key={item.to} to={item.to} className={`relative flex flex-col items-center gap-2 rounded-3xl px-1 py-2 active:scale-95 ${active ? "text-cyan-200" : "text-white/55"}`}>
                {item.badge && <span className={`absolute -top-2 rounded-full px-2 py-0.5 text-[8px] font-black ${item.badge === "HOT" ? "bg-yellow-300 text-black" : "bg-pink-500 text-white"}`}>{item.badge}</span>}
                <div className={`grid h-12 w-12 place-items-center rounded-3xl text-2xl ${active ? "bg-cyan-400/15 shadow-lg shadow-cyan-400/25" : "bg-white/5"}`}>{item.icon}</div>
                <div>{item.label}</div>
              </Tap>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function HomePage() {
  const [sloganIndex, setSloganIndex] = useState(0);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setSloganIndex((i) => (i + 1) % slogans.length), 2800);
    loadStats();
    return () => clearInterval(timer);
  }, []);

  async function loadStats() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      setUser(auth?.user || null);
      const [{ data: postData }, { data: voteData }] = await Promise.all([
        supabase.from("posts").select("id,user_id,ai_score,boost_score,watch_time_total,shares").limit(120),
        supabase.from("votes").select("post_id,user_id,value").limit(3000),
      ]);
      setPosts(postData || []);
      setVotes(voteData || []);
    } catch (err) {
      console.warn("home stats fallback", err);
    }
  }

  const stats = useMemo(() => {
    const voteMap = {};
    votes.forEach((v) => {
      if (v?.post_id) voteMap[v.post_id] = (voteMap[v.post_id] || 0) + Number(v.value || 1);
    });
    const scored = posts.map((p) => ({
      ...p,
      score: Number(voteMap[p.id] || 0) * 12 + Number(p.ai_score || 50) + Number(p.boost_score || 0) * 2 + Number(p.watch_time_total || 0) * 2 + Number(p.shares || 0) * 4,
    })).sort((a, b) => b.score - a.score);
    const myIndex = user?.id ? scored.findIndex((p) => p.user_id === user.id) : -1;
    const me = myIndex >= 0 ? scored[myIndex] : null;
    const next = myIndex > 0 ? scored[myIndex - 1] : null;
    const gap = next && me ? Math.max(1, Math.ceil((next.score - me.score) / 12)) : 27;
    const players = Math.max(1, new Set([...posts.map((p) => p.user_id), ...votes.map((v) => v.user_id)]).size);
    return {
      players,
      votes: votes.length,
      pot: Math.round(25 + players * 0.25 + votes.length * 0.05),
      myRank: myIndex >= 0 ? myIndex + 1 : 1,
      gap,
      top5Gap: Math.max(1, gap * 7),
    };
  }, [posts, votes, user?.id]);

  const slogan = slogans[sloganIndex];

  return (
    <div className="min-h-screen bg-[#050816] pb-[170px] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#082f49_0%,#050816_44%,#02030a_100%)]" />
      <main className="mx-auto max-w-md px-4 py-5">
        <header className="flex items-center justify-between gap-3">
          <BrandLogo />
          <Tap to="/profile" className="grid h-14 w-14 shrink-0 place-items-center rounded-[24px] border border-cyan-300/20 bg-white/10 text-3xl shadow-xl">👤</Tap>
        </header>

        <SloganCard slogan={slogan} />
        <HeroCard />

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-200">🏆 Säännöt heti selväksi</p>
              <h2 className="text-[36px] font-black leading-none">Näin peli toimii</h2>
            </div>
            <Tap to="/pots" className="rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 px-5 py-3 text-sm font-black text-black shadow-xl shadow-yellow-300/25">Potit →</Tap>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <RuleCard n="1" icon="✍️" title="Postaa kerran viikossa" text="Yksi hyvä perustelu viikossa pitää kilpailun reiluna." image={IMG.road} />
            <RuleCard n="2" icon="💗" title="Kerää tykkäyksiä" text="Äänet, katselut ja jaot nostavat scorea." image={IMG.lake} />
            <RuleCard n="3" icon="💎" title="Päivä, viikko, kuukausi" text="Tilanne näkyy Potit-sivulla live-rankingina." image={IMG.lapland} />
            <RuleCard n="4" icon="👑" title="Porukat finaaliin" text="Suurimman XP:n porukat etenevät finaaliin." image={IMG.forest} />
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <MetricCard title="Päivän potti" value={`${stats.pot}€`} icon="💰" text="Potti kasvaa jokaisesta äänestä!" footerLeft={`👥 ${stats.players}`} footerRight={`♡ ${stats.votes}`} image={IMG.archipelago} to="/pots" progress={30 + stats.votes * 8} />
          <MetricCard title="Oma sijoitus" value={`#${stats.myRank}`} icon="🏅" text={`${stats.top5Gap} ääntä top 5:een`} footerLeft="↗ Nousu" footerRight={`${stats.gap} ääntä`} image={IMG.lake} to="/war" progress={100 - stats.gap * 2} />
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
