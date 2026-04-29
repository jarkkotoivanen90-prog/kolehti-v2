import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const IMG = {
  helsinki: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1400&q=90",
  slogan: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=90",
  lake: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=90",
  forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=90",
  lapland: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=90",
  road: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=90",
  archipelago: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=90",
};

const slogans = [
  ["⚡", "KILPAILE. ÄÄNESTÄ. NOUSE.", "Joka ääni vie sinua lähemmäs pottia."],
  ["🔥", "PÄIVÄN POTTI ELÄÄ.", "Katselut, jaot ja tykkäykset nostavat kierrosta."],
  ["👥", "PORUKKA RATKAISEE.", "Yhdessä kerätty XP vie kohti finaalia."],
  ["🏆", "TOP 5 MENEE FINAALIIN.", "Nouse leaderboardissa ennen kierroksen sulkeutumista."],
];

function MotionStyles() {
  return (
    <style>{`
      @keyframes logoBreath { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 12px rgba(34,211,238,.45))} 50%{transform:scale(1.035);filter:drop-shadow(0 0 34px rgba(34,211,238,.95)) drop-shadow(0 0 18px rgba(250,204,21,.45))} }
      @keyframes logoBurst { 0%{transform:scale(1)} 45%{transform:scale(1.1) rotate(-2deg)} 100%{transform:scale(1)} }
      @keyframes shine { 0%{transform:translateX(-150%) skewX(-18deg);opacity:0} 24%{opacity:.85} 52%{transform:translateX(150%) skewX(-18deg);opacity:0} 100%{transform:translateX(150%) skewX(-18deg);opacity:0} }
      @keyframes softPulse { 0%,100%{transform:scale(1);opacity:.72} 50%{transform:scale(1.07);opacity:1} }
      @keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      .logo-idle{animation:logoBreath 3.2s ease-in-out infinite}.logo-action{animation:logoBurst .42s ease both}.logo-reward{animation:logoBurst .8s ease both, logoBreath 1.1s ease-in-out infinite}.shine{position:relative;overflow:hidden}.shine:after{content:"";position:absolute;inset:-8px -40px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);animation:shine 4.8s ease-in-out infinite}.shine-fast:after{content:"";position:absolute;inset:-8px -40px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.82),transparent);animation:shine .9s ease-out}.nav-life{animation:softPulse 2.6s ease-in-out infinite}.floaty{animation:floaty 3.2s ease-in-out infinite}
    `}</style>
  );
}

function KHeartLogo({ mode, onPulse }) {
  const cls = mode === "reward" ? "logo-reward" : mode === "action" ? "logo-action" : "logo-idle";
  return (
    <button type="button" onClick={onPulse} aria-label="KOLEHTI" className={`${cls} relative h-[76px] w-[76px] shrink-0`}>
      <div className="absolute -inset-2 rounded-[34px] bg-cyan-400/15 blur-xl" />
      <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-cyan-200 via-teal-300 to-blue-700 shadow-2xl shadow-cyan-400/40" />
      <div className="absolute inset-[6px] rounded-[24px] border border-white/25 bg-[#031226]/25" />
      <svg viewBox="0 0 120 120" className="absolute inset-[9px] h-[58px] w-[58px] drop-shadow-[0_0_18px_rgba(34,211,238,.9)]">
        <defs><linearGradient id="brandHeart" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="58%" stopColor="#dffbff" /><stop offset="100%" stopColor="#fde68a" /></linearGradient></defs>
        <path d="M60 104C48 90 11 73 11 45c0-14 10-24 23-24 11 0 20 7 26 17 6-10 15-17 26-17 13 0 23 10 23 24 0 28-37 45-49 59Z" fill="url(#brandHeart)" />
        <path d="M38 30h17v29l29-29h24L76 60l34 38H85L55 64v34H38V30Z" fill="#031126" opacity=".96" />
        <path d="M53 31v28l29-28h13L66 59l31 38H84L53 62v35H44V31h9Z" fill="url(#brandHeart)" />
      </svg>
      <div className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full border-4 border-[#050816] bg-yellow-300 text-sm font-black text-black shadow-xl shadow-yellow-300/40">✓</div>
    </button>
  );
}

function BrandHeader({ mode, onPulse }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <KHeartLogo mode={mode} onPulse={onPulse} />
        <button type="button" onClick={onPulse} className="min-w-0 text-left">
          <div className={mode === "idle" ? "shine" : "shine-fast relative overflow-hidden"}>
            <h1 className="text-[42px] font-black leading-[0.82] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-yellow-200 drop-shadow-[0_0_22px_rgba(34,211,238,.35)]">KOLEHTI</h1>
          </div>
          <p className="mt-3 text-[12px] font-black uppercase tracking-[0.28em] text-cyan-200/80">Kilpaile. Auta. Nouse.</p>
        </button>
      </div>
      <Link onClick={() => onPulse("action")} to="/profile" className="nav-life grid h-16 w-16 shrink-0 place-items-center rounded-[28px] border border-cyan-300/25 bg-white/10 text-3xl shadow-xl shadow-cyan-300/10 backdrop-blur-xl">👤</Link>
    </header>
  );
}

function SloganCard({ slogan, onPulse }) {
  return <section onClick={() => onPulse("action")} className="relative mt-5 overflow-hidden rounded-[26px] border border-cyan-300/25 px-5 py-4 shadow-2xl shadow-cyan-400/5"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.58), rgba(2,6,23,.84)), url(${IMG.slogan})` }} /><div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" /><div className="relative flex items-center gap-4"><div className="floaty text-4xl">{slogan[0]}</div><div><div className="text-[22px] font-black leading-tight">{slogan[1]}</div><div className="mt-1 text-sm font-bold text-white/72">{slogan[2]}</div></div></div></section>;
}

function HeroCard({ onPulse }) {
  return <section className="relative mt-5 overflow-hidden rounded-[36px] border border-cyan-300/25 shadow-2xl"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg, rgba(2,6,23,.16), rgba(2,6,23,.38), rgba(2,6,23,.86)), url(${IMG.helsinki})` }} /><div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent" /><div className="relative min-h-[356px] p-5"><div className="w-fit rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100 backdrop-blur-md">🇫🇮 Suomalainen yhteisöpeli</div><div className="mt-16 max-w-[88%]"><p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Tämän päivän kierros</p><h2 className="mt-3 text-[56px] font-black leading-[0.88] tracking-tight text-white drop-shadow-2xl">POTTI<br />AUKI!</h2><p className="mt-5 text-[17px] font-black leading-snug text-white/90">Kirjoita hyvä perustelu, kerää ääniä ja nouse mukaan kilpailuun.</p></div><div className="mt-8 grid grid-cols-2 gap-4"><Link onClick={() => onPulse("reward")} to="/new" className="rounded-[28px] bg-cyan-500 px-4 py-5 text-center text-base font-black uppercase shadow-2xl shadow-cyan-500/30 active:scale-[0.98]">Luo perustelu</Link><Link onClick={() => onPulse("reward")} to="/feed" className="rounded-[28px] border border-white/25 bg-black/30 px-4 py-5 text-center text-base font-black uppercase backdrop-blur-md active:scale-[0.98]">Katso feed</Link></div></div></section>;
}

function RuleCard({ n, icon, title, text, image, onPulse }) {
  return <button type="button" onClick={() => onPulse("action")} className="relative min-h-[230px] overflow-hidden rounded-[28px] border border-white/10 p-4 text-left shadow-xl transition active:scale-[0.97]"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(2,6,23,.20), rgba(2,6,23,.90)), url(${image})` }} /><div className="absolute left-5 top-5 h-14 w-14 rounded-2xl bg-cyan-400/25 blur-xl" /><div className="relative flex min-h-[198px] flex-col justify-between"><div className="flex items-start justify-between gap-2"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-500 text-2xl font-black text-white shadow-xl shadow-cyan-500/35">{n}</div><div className="text-4xl drop-shadow-lg">{icon}</div></div><div><h3 className="text-[23px] font-black leading-tight">{title}</h3><p className="mt-2 text-[13px] font-bold leading-snug text-white/78">{text}</p></div></div></button>;
}

function MetricCard({ title, value, icon, text, footerLeft, footerRight, image, to, progress, onPulse }) {
  return <Link onClick={() => onPulse("reward")} to={to} className="relative block min-h-[248px] overflow-hidden rounded-[30px] border border-white/10 p-4 shadow-2xl transition active:scale-[0.97]"><div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(2,6,23,.18), rgba(2,6,23,.92)), url(${image})` }} /><div className="relative flex min-h-[216px] flex-col"><p className="text-[13px] font-black uppercase tracking-wide text-cyan-200">{title}</p><div className="mt-3 text-[46px] leading-none">{icon}</div><div className="mt-1 truncate text-[46px] font-black leading-none tracking-tight text-white">{value}</div><p className="mt-3 min-h-[38px] text-[13px] font-bold leading-snug text-white/78">{text}</p><div className="mt-auto h-3 overflow-hidden rounded-full bg-black/50"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${Math.max(8, Math.min(100, progress))}%` }} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-black text-white/85"><span className="truncate">{footerLeft}</span><span className="truncate text-right">{footerRight}</span></div></div></Link>;
}

function BottomNav({ onPulse }) {
  const location = useLocation();
  const tap = (mode = "action") => { navigator.vibrate?.(10); onPulse(mode); };
  const items = [{ to: "/", icon: "⌂", label: "Koti", alive: true }, { to: "/feed", icon: "🔥", label: "Feed", badge: "LIVE" }, { to: "/new", icon: "+", label: "Uusi", fab: true }, { to: "/pots", icon: "🏆", label: "Potit", badge: "HOT", gold: true }, { to: "/profile", icon: "●", label: "Profiili", alive: true }];
  return <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md px-5 pb-4 text-white"><div className="relative rounded-[40px] border border-cyan-300/25 bg-[#061126]/95 px-4 pb-5 pt-4 shadow-2xl shadow-cyan-500/15 backdrop-blur-2xl"><div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" /><div className="grid grid-cols-5 items-end text-center text-[12px] font-black">{items.map((item) => { const active = location.pathname === item.to; if (item.fab) return <Link key={item.to} to={item.to} onClick={() => tap("reward")} className="-mt-12 flex flex-col items-center"><div className="grid h-[88px] w-[88px] place-items-center rounded-full border-[6px] border-[#061126] bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-600 text-[64px] font-black leading-none shadow-2xl shadow-cyan-400/45 transition active:scale-95">+</div><div className="mt-1 text-white">{item.label}</div></Link>; return <Link key={item.to} to={item.to} onClick={() => tap("action")} className={`relative flex flex-col items-center gap-2 rounded-3xl px-1 py-2 transition active:scale-95 ${active ? "text-cyan-200" : "text-white/55"}`}>{item.badge && <span className={`absolute -top-2 rounded-full px-2 py-0.5 text-[8px] font-black ${item.gold ? "bg-yellow-300 text-black shadow-lg shadow-yellow-300/30" : "bg-pink-500 text-white shadow-lg shadow-pink-500/30"}`}>{item.badge}</span>}<div className={`relative grid h-12 w-12 place-items-center rounded-3xl text-2xl transition ${active ? "bg-cyan-400/15 shadow-lg shadow-cyan-400/30" : item.gold ? "bg-yellow-300/10 shadow-lg shadow-yellow-300/10" : "bg-white/5"} ${item.alive ? "nav-life" : ""}`}>{item.alive && <span className="absolute inset-0 rounded-3xl border border-cyan-300/20" />}{item.icon}</div><div>{item.label}</div></Link>; })}</div></div></nav>;
}

export default function HomePage() {
  const [sloganIndex, setSloganIndex] = useState(0); const [posts, setPosts] = useState([]); const [votes, setVotes] = useState([]); const [user, setUser] = useState(null); const [logoMode, setLogoMode] = useState("idle"); const timerRef = useRef(null);
  function pulseLogo(mode = "reward") { clearTimeout(timerRef.current); setLogoMode(mode); navigator.vibrate?.(8); timerRef.current = setTimeout(() => setLogoMode("idle"), mode === "reward" ? 900 : 420); }
  useEffect(() => { const sloganTimer = setInterval(() => setSloganIndex((i) => (i + 1) % slogans.length), 2800); loadStats(); const onScroll = () => window.scrollY > 30 && pulseLogo("action"); window.addEventListener("scroll", onScroll, { passive: true }); return () => { clearInterval(sloganTimer); clearTimeout(timerRef.current); window.removeEventListener("scroll", onScroll); }; }, []);
  async function loadStats() { try { const { data: auth } = await supabase.auth.getUser(); setUser(auth?.user || null); const [{ data: postData }, { data: voteData }] = await Promise.all([supabase.from("posts").select("id,user_id,ai_score,boost_score,watch_time_total,shares").limit(120), supabase.from("votes").select("post_id,user_id,value").limit(3000)]); setPosts(postData || []); setVotes(voteData || []); } catch (err) { console.warn("home stats fallback", err); } }
  const stats = useMemo(() => { const voteMap = {}; votes.forEach((v) => { if (v?.post_id) voteMap[v.post_id] = (voteMap[v.post_id] || 0) + Number(v.value || 1); }); const scored = posts.map((p) => ({ ...p, score: Number(voteMap[p.id] || 0) * 12 + Number(p.ai_score || 50) + Number(p.boost_score || 0) * 2 + Number(p.watch_time_total || 0) * 2 + Number(p.shares || 0) * 4 })).sort((a, b) => b.score - a.score); const myIndex = user?.id ? scored.findIndex((p) => p.user_id === user.id) : -1; const me = myIndex >= 0 ? scored[myIndex] : null; const next = myIndex > 0 ? scored[myIndex - 1] : null; const gap = next && me ? Math.max(1, Math.ceil((next.score - me.score) / 12)) : 27; const players = Math.max(1, new Set([...posts.map((p) => p.user_id), ...votes.map((v) => v.user_id)]).size); return { players, votes: votes.length, pot: Math.round(25 + players * 0.25 + votes.length * 0.05), myRank: myIndex >= 0 ? myIndex + 1 : 1, gap, top5Gap: Math.max(1, gap * 7) }; }, [posts, votes, user?.id]);
  const slogan = slogans[sloganIndex];
  return <div className="min-h-screen bg-[#050816] pb-36 text-white"><MotionStyles /><div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#082f49_0%,#050816_44%,#02030a_100%)]" /><main className="mx-auto max-w-md px-4 py-5"><BrandHeader mode={logoMode} onPulse={pulseLogo} /><SloganCard slogan={slogan} onPulse={pulseLogo} /><HeroCard onPulse={pulseLogo} /><section className="mt-8"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-sm font-black uppercase tracking-wide text-cyan-200">🏆 Säännöt heti selväksi</p><h2 className="text-[38px] font-black leading-none">Näin peli toimii</h2></div><Link onClick={() => pulseLogo("reward")} to="/pots" className="rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 px-5 py-3 text-sm font-black text-black shadow-xl shadow-yellow-300/30 active:scale-[0.98]">Potit →</Link></div><div className="grid grid-cols-2 gap-3"><RuleCard onPulse={pulseLogo} n="1" icon="✍️" title="Postaa kerran viikossa" text="Yksi hyvä perustelu viikossa pitää kilpailun reiluna." image={IMG.road} /><RuleCard onPulse={pulseLogo} n="2" icon="💗" title="Kerää tykkäyksiä" text="Äänet, katselut ja jaot nostavat scorea." image={IMG.lake} /><RuleCard onPulse={pulseLogo} n="3" icon="💎" title="Päivä, viikko, kuukausi" text="Tilanne näkyy Potit-sivulla live-rankingina." image={IMG.lapland} /><RuleCard onPulse={pulseLogo} n="4" icon="👑" title="Porukat finaaliin" text="Suurimman XP:n porukat etenevät finaaliin." image={IMG.forest} /></div></section><section className="mt-5 grid grid-cols-2 gap-3"><MetricCard onPulse={pulseLogo} title="Päivän potti" value={`${stats.pot}€`} icon="💰" text="Potti kasvaa jokaisesta äänestä!" footerLeft={`👥 ${stats.players}`} footerRight={`♡ ${stats.votes}`} image={IMG.archipelago} to="/pots" progress={30 + stats.votes * 8} /><MetricCard onPulse={pulseLogo} title="Oma sijoitus" value={`#${stats.myRank}`} icon="🏅" text={`${stats.top5Gap} ääntä top 5:een`} footerLeft="↗ Nousu" footerRight={`${stats.gap} ääntä`} image={IMG.lake} to="/war" progress={100 - stats.gap * 2} /></section></main><BottomNav onPulse={pulseLogo} /></div>;
}
