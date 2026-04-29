import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const helsinkiBg = "https://images.unsplash.com/photo-1559548331-f9cb98001426?auto=format&fit=crop&w=1400&q=85";
const finlandLake = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85";
const finlandForest = "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=85";
const finlandWinter = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=85";
const finlandNight = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85";
const UI_VERSION = "KOLEHTI V2 · LIVE";

const slogans = [
  "Kilpaile. Auta. Nouse.",
  "Yksi ääni voi muuttaa sijoituksen.",
  "Katso, tykkää ja kasvata porukan XP:tä.",
  "Porukka voittaa yhdessä.",
  "Päivän potti elää jokaisesta liikkeestä.",
];

function KolehtiMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${compact ? "h-12 w-12" : "h-16 w-16"} relative grid place-items-center rounded-[24px] bg-gradient-to-br from-cyan-300 via-teal-300 to-blue-600 shadow-2xl shadow-cyan-400/30`}>
        <div className="absolute inset-1 rounded-[20px] bg-[#061126]/20 backdrop-blur-sm" />
        <div className="relative text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(34,211,238,.8)]">K</div>
        <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-yellow-300 text-xs shadow-lg">💙</div>
      </div>
      <div>
        <h1 className={`${compact ? "text-2xl" : "text-5xl"} font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-yellow-200 drop-shadow-[0_0_18px_rgba(34,211,238,.35)]`}>KOLEHTI</h1>
        <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-200/80">Kilpaile. Auta. Nouse.</p>
      </div>
    </div>
  );
}

function BottomNav() {
  const location = useLocation();
  const items = [
    { to: "/", icon: "⌂", label: "Koti", badge: null },
    { to: "/feed", icon: "🔥", label: "Feed", badge: "LIVE" },
    { to: "/new", icon: "+", label: "Uusi", fab: true, badge: null },
    { to: "/pots", icon: "🏆", label: "Potit", badge: "HOT" },
    { to: "/profile", icon: "◉", label: "Profiili", badge: null },
  ];

  function tap() {
    navigator.vibrate?.(12);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md px-3 pb-3 text-white">
      <div className="relative rounded-[34px] border border-cyan-300/20 bg-[#061126]/90 px-3 pb-4 pt-3 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="grid grid-cols-5 items-end text-center text-[11px] font-black">
          {items.map((item) => {
            const active = location.pathname === item.to;
            if (item.fab) {
              return (
                <Link key={item.to} to={item.to} onClick={tap} className="-mt-10 flex flex-col items-center">
                  <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-[#061126] bg-gradient-to-br from-cyan-300 to-blue-600 text-6xl font-black leading-none shadow-2xl shadow-cyan-400/40 transition active:scale-95">+</div>
                  <div className="mt-1 text-white">{item.label}</div>
                </Link>
              );
            }
            return (
              <Link key={item.to} to={item.to} onClick={tap} className={`relative flex flex-col items-center gap-1 rounded-2xl px-1 py-2 transition active:scale-95 ${active ? "text-cyan-200" : "text-white/55"}`}>
                {item.badge && <span className={`absolute -top-1 rounded-full px-1.5 py-0.5 text-[7px] font-black ${item.badge === "HOT" ? "bg-yellow-300 text-black" : "bg-pink-500 text-white"}`}>{item.badge}</span>}
                <div className={`grid h-9 w-9 place-items-center rounded-2xl text-xl ${active ? "bg-cyan-400/15 shadow-lg shadow-cyan-400/20" : "bg-white/5"}`}>{item.icon}</div>
                <div>{item.label}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Rule({ n, icon, title, text, image }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 p-4 shadow-xl">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(2,6,23,.30), rgba(2,6,23,.88)), url(${image})` }} />
      <div className="relative flex gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500 text-xl font-black text-white shadow-lg shadow-cyan-500/25">{n}</div>
        <div>
          <div className="text-3xl">{icon}</div>
          <h3 className="mt-1 text-lg font-black leading-tight">{title}</h3>
          <p className="mt-2 text-[13px] font-bold leading-snug text-white/75">{text}</p>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, title, value, text, image, to }) {
  return (
    <Link to={to} className="relative overflow-hidden rounded-[30px] border border-white/10 p-5 shadow-xl transition active:scale-[0.98]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(2,6,23,.18), rgba(2,6,23,.86)), url(${image})` }} />
      <div className="relative">
        <div className="text-4xl">{icon}</div>
        <h3 className="mt-3 text-xs font-black uppercase tracking-wide text-cyan-200">{title}</h3>
        <p className="mt-1 text-4xl font-black text-white">{value}</p>
        <p className="mt-2 text-[13px] font-bold leading-snug text-white/70">{text}</p>
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
    const timer = setInterval(() => setSloganIndex((value) => (value + 1) % slogans.length), 2600);
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
    const myRank = myIndex >= 0 ? myIndex + 1 : "—";
    const next = myIndex > 0 ? scored[myIndex - 1] : null;
    const me = myIndex >= 0 ? scored[myIndex] : null;
    const gap = next && me ? Math.max(1, Math.ceil((next.score - me.score) / 12)) : 0;
    return {
      pot: Math.round(25 + Math.max(1, new Set(posts.map((p) => p.user_id)).size) * 0.25 + votes.length * 0.05),
      players: Math.max(1, new Set([...posts.map((p) => p.user_id), ...votes.map((v) => v.user_id)]).size),
      votes: votes.length,
      myRank,
      gap,
    };
  }, [posts, votes, user?.id]);

  return (
    <div className="min-h-screen bg-[#050816] pb-32 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_42%,#02030a_100%)]" />

      <main className="mx-auto max-w-md px-4 py-5">
        <header className="mb-5 flex items-center justify-between">
          <KolehtiMark />
          <Link to="/profile" className="grid h-14 w-14 place-items-center rounded-3xl border border-cyan-300/20 bg-white/10 text-3xl shadow-xl backdrop-blur-xl">👤</Link>
        </header>

        <section className="mb-4 rounded-[24px] border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-100 shadow-xl backdrop-blur-xl">
          ⚡ {slogans[sloganIndex]}
        </section>

        <section
          className="relative min-h-[390px] overflow-hidden rounded-[38px] border border-cyan-300/25 shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(rgba(2,6,23,.05), rgba(2,6,23,.88)), url(${helsinkiBg})`,
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
              <p className="mt-3 text-sm font-bold leading-snug text-white/75">
                Kirjoita perustelu, kerää ääniä, kasvata porukan XP:tä ja nouse kohti päivän pottia.
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
          <div className="rounded-2xl bg-black/25 p-3 text-center"><div className="text-xl font-black">€{stats.pot}</div><div className="text-[10px] font-black uppercase text-white/45">päiväpotti</div></div>
          <div className="rounded-2xl bg-black/25 p-3 text-center"><div className="text-xl font-black">Top 5</div><div className="text-[10px] font-black uppercase text-white/45">finaali</div></div>
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
            <Rule n="1" icon="✍️" title="Yksi perustelu viikossa" text="Postaa kerran viikossa. Media, katselut ja perustelun laatu nostavat näkyvyyttä." image={finlandLake} />
            <Rule n="2" icon="💗" title="Äänet ratkaisevat" text="Tykkäykset, katselut ja jaot nostavat scorea. Double tap tykkää nopeasti feedissä." image={finlandForest} />
            <Rule n="3" icon="👀" title="Katso ja kasvata XP:tä" text="Kuvaa tai videota katsomalla kasvatat porukan XP:tä ja päivän potin tunnetta." image={finlandWinter} />
            <Rule n="4" icon="👑" title="Porukat finaaliin" text="Suurimman XP:n porukat etenevät finaaliin, jossa top-5 pelaajasta äänestetään voittaja." image={finlandNight} />
          </div>
        </section>

        <section className="mt-7 grid grid-cols-2 gap-3">
          <StatusCard icon="💰" title="Päivän potti" value={`€${stats.pot}`} text={`${stats.players} pelaajaa · ${stats.votes} ääntä mukana tänään.`} image={finlandLake} to="/pots" />
          <StatusCard icon="🏅" title="Oma sijoitus" value={`#${stats.myRank}`} text={stats.myRank === "—" ? "Luo perustelu ja pääset leaderboardiin." : `Seuraavaan nousuun noin ${stats.gap || 1} ääntä.`} image={finlandForest} to="/war" />
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
