import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const helsinkiBg = "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=90";
const lakeBg = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=90";
const sunsetBg = "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=90";
const nightBg = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=90";
const forestBg = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=90";
const roadBg = "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=90";

const slogans = [
  ["⚡", "KILPAILE. ÄÄNESTÄ. NOUSE.", "Joka ääni vie sua lähemmäs pottia."],
  ["🔥", "PÄIVÄN POTTI ELÄÄ.", "Katselut, jaot ja tykkäykset nostavat peliä."],
  ["👥", "PORUKKA RATKAISEE.", "Yhdessä kerätty XP vie kohti finaalia."],
  ["🏆", "TOP 5 MENEE FINAALIIN.", "Nouse leaderboardissa ennen kuin kierros sulkeutuu."],
];

function KolehtiLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative grid h-[74px] w-[74px] place-items-center rounded-[30px] bg-gradient-to-br from-cyan-300 via-teal-300 to-blue-700 shadow-2xl shadow-cyan-400/30">
        <div className="absolute inset-[7px] rounded-[24px] border border-white/20 bg-[#061126]/15" />
        <div className="relative text-[42px] font-black leading-none text-white drop-shadow-[0_0_16px_rgba(34,211,238,.8)]">K</div>
        <div className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full border-4 border-[#050816] bg-yellow-300 text-sm shadow-xl">💙</div>
      </div>
      <div className="min-w-0">
        <h1 className="text-[46px] font-black leading-[0.82] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-yellow-200 drop-shadow-[0_0_22px_rgba(34,211,238,.35)]">KOLEHTI</h1>
        <p className="mt-3 text-[13px] font-black uppercase tracking-[0.27em] text-cyan-200/75">Kilpaile. Auta. Nouse.</p>
      </div>
    </div>
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
  const tap = () => navigator.vibrate?.(12);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md px-5 pb-4 text-white">
      <div className="relative rounded-[38px] border border-cyan-300/25 bg-[#061126]/95 px-4 pb-5 pt-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <div className="grid grid-cols-5 items-end text-center text-[12px] font-black">
          {items.map((item) => {
            const active = location.pathname === item.to;
            if (item.fab) {
              return (
                <Link key={item.to} to={item.to} onClick={tap} className="-mt-12 flex flex-col items-center">
                  <div className="grid h-[86px] w-[86px] place-items-center rounded-full border-[6px] border-[#061126] bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-600 text-[64px] font-black leading-none shadow-2xl shadow-cyan-400/45 transition active:scale-95">+</div>
                  <div className="mt-1 text-white">{item.label}</div>
                </Link>
              );
            }
            return (
              <Link key={item.to} to={item.to} onClick={tap} className={`relative flex flex-col items-center gap-2 rounded-3xl px-1 py-2 transition active:scale-95 ${active ? "text-cyan-200" : "text-white/55"}`}>
                {item.badge && <span className={`absolute -top-2 rounded-full px-2 py-0.5 text-[8px] font-black ${item.badge === "HOT" ? "bg-yellow-300 text-black" : "bg-pink-500 text-white"}`}>{item.badge}</span>}
                <div className={`grid h-12 w-12 place-items-center rounded-3xl text-2xl ${active ? "bg-cyan-400/15 shadow-lg shadow-cyan-400/20" : "bg-white/5"}`}>{item.icon}</div>
                <div>{item.label}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function HeroCard() {
  return (
    <section className="relative mt-5 overflow-hidden rounded-[34px] border border-cyan-300/25 shadow-2xl" style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.15), rgba(2,6,23,.35), rgba(2,6,23,.78)), url(${helsinkiBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="min-h-[310px] p-5">
        <div className="w-fit rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100 backdrop-blur-md">🇫🇮 Suomalainen yhteisöpeli</div>
        <div className="mt-12 max-w-[86%]">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-200">Tämän päivän kierros</p>
          <h2 className="mt-3 text-[52px] font-black leading-none tracking-tight">POTTI AUKI!</h2>
          <p className="mt-4 text-[17px] font-black leading-snug text-white/90">Kirjoita hyvä perustelu, kerää ääniä ja nouse mukaan kilpailuun.</p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link to="/new" className="rounded-[26px] bg-cyan-500 px-5 py-4 text-center text-base font-black uppercase shadow-2xl shadow-cyan-500/30">Luo perustelu</Link>
          <Link to="/feed" className="rounded-[26px] border border-white/25 bg-black/25 px-5 py-4 text-center text-base font-black uppercase backdrop-blur-md">Katso feed</Link>
        </div>
      </div>
    </section>
  );
}

function RuleCard({ n, icon, title, text, image }) {
  return (
    <div className="relative min-h-[210px] overflow-hidden rounded-[26px] border border-white/10 p-4 shadow-xl">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(2,6,23,.15), rgba(2,6,23,.88)), url(${image})` }} />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500 text-xl font-black text-white shadow-xl shadow-cyan-500/25">{n}</div>
          <div className="text-3xl">{icon}</div>
        </div>
        <div>
          <h3 className="text-[20px] font-black leading-tight">{title}</h3>
          <p className="mt-2 text-[12px] font-bold leading-snug text-white/78">{text}</p>
        </div>
      </div>
    </div>
  );
}

function BigMetricCard({ title, value, icon, text, footerLeft, footerRight, image, to, progress = 80 }) {
  return (
    <Link to={to} className="relative block min-h-[230px] overflow-hidden rounded-[30px] border border-white/10 p-5 shadow-2xl transition active:scale-[0.98]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(2,6,23,.12), rgba(2,6,23,.86)), url(${image})` }} />
      <div className="relative">
        <p className="text-sm font-black uppercase tracking-wide text-cyan-200">{title}</p>
        <div className="mt-5 flex items-end gap-4">
          <div className="text-5xl">{icon}</div>
          <div className="text-[58px] font-black leading-none tracking-tight">{value}</div>
        </div>
        <p className="mt-4 text-base font-bold text-white/85">{text}</p>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/40">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm font-black text-white/85">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [sloganIndex, setSloganIndex] = useState(0);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setSloganIndex((value) => (value + 1) % slogans.length), 2800);
    loadHomeStats();
    return () => clearInterval(timer);
  }, []);

  async function loadHomeStats() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      setUser(auth?.user || null);
      const [{ data: postData }, { data: voteData }] = await Promise.all([
        supabase.from("posts").select("id,user_id,content,ai_score,boost_score,watch_time_total,shares").limit(120),
        supabase.from("votes").select("post_id,user_id,value").limit(3000),
      ]);
      setPosts(postData || []);
      setVotes(voteData || []);
    } catch (error) {
      console.warn("home stats fallback", error);
    }
  }

  const stats = useMemo(() => {
    const voteMap = {};
    votes.forEach((vote) => {
      if (!vote?.post_id) return;
      voteMap[vote.post_id] = (voteMap[vote.post_id] || 0) + Number(vote.value || 1);
    });
    const scored = posts.map((post) => ({
      ...post,
      votes: voteMap[post.id] || 0,
      score: Number(voteMap[post.id] || 0) * 12 + Number(post.ai_score || 50) + Number(post.boost_score || 0) * 2 + Number(post.watch_time_total || 0) * 2 + Number(post.shares || 0) * 4,
    })).sort((a, b) => b.score - a.score);
    const myIndex = user?.id ? scored.findIndex((post) => post.user_id === user.id) : -1;
    const me = myIndex >= 0 ? scored[myIndex] : null;
    const next = myIndex > 0 ? scored[myIndex - 1] : null;
    const gap = next && me ? Math.max(1, Math.ceil((next.score - me.score) / 12)) : 27;
    const players = Math.max(1, new Set([...posts.map((p) => p.user_id), ...votes.map((v) => v.user_id)]).size);
    return {
      pot: Math.round(25 + players * 0.25 + votes.length * 0.05),
      players,
      votes: votes.length,
      myRank: myIndex >= 0 ? myIndex + 1 : 7,
      gap,
      top5Gap: Math.max(1, gap * 7),
    };
  }, [posts, votes, user?.id]);

  const slogan = slogans[sloganIndex];

  return (
    <div className="min-h-screen bg-[#050816] pb-36 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#082f49_0%,#050816_44%,#02030a_100%)]" />
      <main className="mx-auto max-w-md px-4 py-5">
        <header className="flex items-center justify-between gap-4">
          <KolehtiLogo />
          <Link to="/profile" className="grid h-16 w-16 shrink-0 place-items-center rounded-[28px] border border-cyan-300/20 bg-white/10 text-3xl shadow-xl backdrop-blur-xl">👤</Link>
        </header>

        <section className="mt-5 rounded-[24px] border border-cyan-300/20 bg-cyan-500/10 px-5 py-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{slogan[0]}</div>
            <div>
              <div className="text-[20px] font-black leading-tight">{slogan[1]}</div>
              <div className="text-sm font-bold text-white/75">{slogan[2]}</div>
            </div>
          </div>
        </section>

        <HeroCard />

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-200">🏆 Säännöt heti selväksi</p>
              <h2 className="text-[38px] font-black leading-none">Näin peli toimii</h2>
            </div>
            <Link to="/pots" className="rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white/70">Potit →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <RuleCard n="1" icon="✍️" title="Postaa kerran viikossa" text="Yksi hyvä perustelu viikossa pitää kilpailun reiluna." image={lakeBg} />
            <RuleCard n="2" icon="💗" title="Kerää tykkäyksiä" text="Äänet, katselut ja jaot nostavat scorea." image={sunsetBg} />
            <RuleCard n="3" icon="💎" title="Päivä, viikko, kuukausi" text="Tilanne näkyy Potit-sivulla live-rankingina." image={nightBg} />
            <RuleCard n="4" icon="👑" title="Porukat finaaliin" text="Suurimman XP:n porukat etenevät finaaliin." image={forestBg} />
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <BigMetricCard title="Päivän potti" value={`${stats.pot}€`} icon="💰" text="Potti kasvaa jokaisesta äänestä!" footerLeft={`👥 ${stats.players} pelaajaa`} footerRight={`♡ ${stats.votes} ääntä`} image={roadBg} to="/pots" progress={Math.min(100, 30 + stats.votes * 8)} />
          <BigMetricCard title="Oma sijoitus" value={`#${stats.myRank}`} icon="🏅" text={`${stats.top5Gap} ääntä top 5:een`} footerLeft="↗" footerRight={`Seuraavaan: ${stats.gap} ääntä`} image={sunsetBg} to="/war" progress={Math.min(100, 100 - stats.gap * 2)} />
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
