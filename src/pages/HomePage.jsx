import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const IMG = {
  helsinki: "https://commons.wikimedia.org/wiki/Special:FilePath/Helsinki_skyline_(Sep_2024_-_01).jpg?width=1600",
  slogan: "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1400",
  lake: "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1200",
  forest: "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=1200",
  lapland: "https://commons.wikimedia.org/wiki/Special:FilePath/Aurora_borealis_(21868630118).jpg?width=1200",
  road: "https://commons.wikimedia.org/wiki/Special:FilePath/Road_in_Finland.jpg?width=1200",
  archipelago: "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200",
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
      @keyframes logoBreath{0%,100%{transform:scale(1);filter:drop-shadow(0 0 12px rgba(34,211,238,.45))}50%{transform:scale(1.035);filter:drop-shadow(0 0 34px rgba(34,211,238,.95)) drop-shadow(0 0 18px rgba(250,204,21,.45))}}
      @keyframes logoBurst{0%{transform:scale(1)}45%{transform:scale(1.12) rotate(-2deg)}100%{transform:scale(1)}}
      @keyframes shine{0%{transform:translateX(-150%) skewX(-18deg);opacity:0}24%{opacity:.85}52%{transform:translateX(150%) skewX(-18deg);opacity:0}100%{transform:translateX(150%) skewX(-18deg);opacity:0}}
      @keyframes softPulse{0%,100%{transform:scale(1);opacity:.72}50%{transform:scale(1.07);opacity:1}}
      @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      @keyframes heroSweep{0%{transform:translateX(-140%) skewX(-18deg);opacity:0}22%{opacity:.45}58%{transform:translateX(150%) skewX(-18deg);opacity:0}100%{transform:translateX(150%) skewX(-18deg);opacity:0}}
      .logo-idle{animation:logoBreath 3.2s ease-in-out infinite}.logo-action{animation:logoBurst .42s ease both}.logo-reward{animation:logoBurst .8s ease both,logoBreath 1.1s ease-in-out infinite}.shine{position:relative;overflow:hidden}.shine:after{content:"";position:absolute;inset:-8px -40px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);animation:shine 4.8s ease-in-out infinite}.nav-life{animation:softPulse 2.6s ease-in-out infinite}.floaty{animation:floaty 3.2s ease-in-out infinite}.hero-sweep:after{content:"";position:absolute;inset:-40px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);animation:heroSweep 5.2s ease-in-out infinite;pointer-events:none}
    `}</style>
  );
}

function PhotoLayer({ src, overlay = "linear-gradient(rgba(2,6,23,.18),rgba(2,6,23,.9))", position = "center" }) {
  return (
    <>
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} loading="eager" decoding="async" />
      <div className="absolute inset-0" style={{ background: overlay }} />
    </>
  );
}

function Tap({ children, className = "", to = "/", onPulse }) {
  return <Link to={to} onClick={() => { navigator.vibrate?.(8); onPulse?.(); }} className={className}>{children}</Link>;
}

function BrandLogo({ mode = "idle", onPulse }) {
  const cls = mode === "reward" ? "logo-reward" : mode === "action" ? "logo-action" : "logo-idle";
  return (
    <button type="button" onClick={onPulse} className="flex items-center gap-3 text-left">
      <div className={`${cls} relative grid h-[74px] w-[74px] shrink-0 place-items-center rounded-[30px] bg-gradient-to-br from-cyan-200 via-teal-300 to-blue-700 shadow-2xl shadow-cyan-400/40`}>
        <div className="absolute -inset-2 rounded-[34px] bg-cyan-300/20 blur-xl" />
        <div className="absolute inset-[6px] rounded-[24px] border border-white/25 bg-[#031226]/20" />
        <svg viewBox="0 0 120 120" className="relative h-[56px] w-[56px] drop-shadow-[0_0_18px_rgba(34,211,238,.9)]">
          <defs><linearGradient id="heartLogo" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff"/><stop offset="60%" stopColor="#dffbff"/><stop offset="100%" stopColor="#fde68a"/></linearGradient></defs>
          <path d="M60 103C48 89 12 72 12 45c0-14 10-24 23-24 11 0 19 7 25 17 6-10 14-17 25-17 13 0 23 10 23 24 0 27-36 44-48 58Z" fill="url(#heartLogo)" />
          <path d="M38 31h17v28l28-28h23L76 60l33 37H84L55 64v33H38V31Z" fill="#031126" opacity=".96" />
          <path d="M53 31v28l29-28h13L66 59l31 38H84L53 62v35H44V31h9Z" fill="url(#heartLogo)" />
        </svg>
        <div className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full border-4 border-[#050816] bg-yellow-300 text-sm font-black text-black shadow-xl shadow-yellow-300/40">✓</div>
      </div>
      <div className="min-w-0">
        <div className="shine"><h1 className="text-[42px] font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-yellow-200 drop-shadow-[0_0_22px_rgba(34,211,238,.35)]">KOLEHTI</h1></div>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.25em] text-cyan-200/75">Kilpaile. Auta. Nouse.</p>
      </div>
    </button>
  );
}

function SloganCard({ slogan, onPulse }) {
  return (
    <button type="button" onClick={onPulse} className="relative mt-5 w-full overflow-hidden rounded-[28px] border border-cyan-300/25 p-4 text-left shadow-2xl shadow-cyan-400/5 active:scale-[0.99]">
      <PhotoLayer src={IMG.slogan} overlay="linear-gradient(90deg,rgba(2,6,23,.45),rgba(2,6,23,.86))" />
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      <div className="relative flex items-center gap-4"><div className="floaty text-4xl">{slogan[0]}</div><div><div className="text-[21px] font-black leading-tight text-white">{slogan[1]}</div><div className="mt-1 text-sm font-bold text-white/72">{slogan[2]}</div></div></div>
    </button>
  );
}

function HeroCard({ onPulse }) {
  return (
    <section className="hero-sweep relative mt-5 overflow-hidden rounded-[38px] border border-cyan-300/25 shadow-2xl shadow-cyan-500/10">
      <PhotoLayer src={IMG.helsinki} overlay="linear-gradient(90deg,rgba(2,6,23,.10),rgba(2,6,23,.38),rgba(2,6,23,.88))" position="center" />
      <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/90 to-transparent" />
      <div className="relative min-h-[370px] p-5">
        <div className="flex items-center justify-between gap-3"><div className="w-fit rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100 backdrop-blur-md">🇫🇮 Suomalainen yhteisöpeli</div><div className="rounded-full bg-green-400 px-3 py-1 text-[10px] font-black text-black shadow-lg shadow-green-400/25">LIVE</div></div>
        <div className="mt-16 max-w-[90%]"><p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Tämän päivän kierros</p><h2 className="mt-3 text-[58px] font-black leading-[0.9] tracking-tight text-white drop-shadow-2xl">POTTI<br/>AUKI!</h2><p className="mt-5 text-[17px] font-black leading-snug text-white/88">Kirjoita perustelu, kerää ääniä ja nouse mukaan kilpailuun.</p></div>
        <div className="mt-8 grid grid-cols-2 gap-4"><Tap onPulse={onPulse} to="/new" className="rounded-[28px] bg-cyan-500 px-4 py-5 text-center text-base font-black uppercase text-white shadow-2xl shadow-cyan-500/30 active:scale-[0.98]">Luo perustelu</Tap><Tap onPulse={onPulse} to="/feed" className="rounded-[28px] border border-white/20 bg-black/30 px-4 py-5 text-center text-base font-black uppercase text-white backdrop-blur-md active:scale-[0.98]">Katso feed</Tap></div>
      </div>
    </section>
  );
}

function RuleCard({ n, icon, title, text, image, onPulse }) {
  return <button type="button" onClick={onPulse} className="relative min-h-[226px] overflow-hidden rounded-[30px] border border-white/10 p-4 text-left shadow-2xl transition active:scale-[0.97]"><PhotoLayer src={image} /><div className="absolute left-5 top-5 h-14 w-14 rounded-2xl bg-cyan-400/25 blur-xl"/><div className="relative flex min-h-[194px] flex-col justify-between"><div className="flex items-start justify-between"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-500 text-2xl font-black text-white shadow-xl shadow-cyan-500/35">{n}</div><div className="text-4xl drop-shadow-lg">{icon}</div></div><div><h3 className="text-[22px] font-black leading-tight text-white">{title}</h3><p className="mt-2 text-[13px] font-bold leading-snug text-white/74">{text}</p></div></div></button>;
}

function MetricCard({ title, value, icon, text, footerLeft, footerRight, image, to, progress, hot, onPulse }) {
  return <Tap onPulse={onPulse} to={to} className={`relative block min-h-[250px] overflow-hidden rounded-[32px] border p-4 shadow-2xl active:scale-[0.98] ${hot ? "border-yellow-300/35 shadow-yellow-300/10" : "border-white/10"}`}><PhotoLayer src={image} overlay="linear-gradient(rgba(2,6,23,.12),rgba(2,6,23,.9))" /><div className="relative flex min-h-[218px] flex-col"><div className="flex items-center justify-between"><p className="text-[12px] font-black uppercase tracking-wide text-cyan-200">{title}</p>{hot && <span className="rounded-full bg-yellow-300 px-2 py-1 text-[9px] font-black text-black">HOT</span>}</div><div className="mt-3 text-5xl leading-none">{icon}</div><div className="mt-1 truncate text-[44px] font-black leading-none text-white">{value}</div><p className="mt-3 min-h-[36px] text-[13px] font-bold leading-snug text-white/76">{text}</p><div className="mt-auto h-3 overflow-hidden rounded-full bg-black/45"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" style={{ width: `${Math.max(8,Math.min(100,progress))}%` }}/></div><div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-black text-white/82"><span className="truncate">{footerLeft}</span><span className="truncate text-right">{footerRight}</span></div></div></Tap>;
}

function BottomNav({ onPulse }) {
  const location = useLocation();
  const items = [{to:"/",icon:"⌂",label:"Koti",alive:true},{to:"/feed",icon:"🔥",label:"Feed",badge:"LIVE"},{to:"/new",icon:"+",label:"Uusi",fab:true},{to:"/pots",icon:"🏆",label:"Potit",badge:"HOT",gold:true},{to:"/profile",icon:"●",label:"Profiili",alive:true}];
  return <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md px-5 pb-4 text-white"><div className="relative overflow-hidden rounded-[40px] border border-cyan-300/25 px-4 pb-5 pt-4 shadow-2xl shadow-cyan-500/15 backdrop-blur-2xl"><img src={IMG.lapland} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" loading="lazy" decoding="async"/><div className="absolute inset-0 bg-[#061126]/78"/><div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent"/><div className="relative z-10 grid grid-cols-5 items-end text-center text-[12px] font-black">{items.map(item=>{const active=location.pathname===item.to;if(item.fab)return <Tap onPulse={onPulse} key={item.to} to={item.to} className="-mt-12 flex flex-col items-center"><div className="grid h-[88px] w-[88px] place-items-center rounded-full border-[6px] border-[#061126] bg-gradient-to-br from-cyan-300 via-sky-400 to-blue-600 text-[64px] font-black leading-none shadow-2xl shadow-cyan-400/45">+</div><div className="mt-1 text-white">{item.label}</div></Tap>;return <Tap onPulse={onPulse} key={item.to} to={item.to} className={`relative flex flex-col items-center gap-2 rounded-3xl px-1 py-2 active:scale-95 ${active?"text-cyan-200":"text-white/55"}`}>{item.badge&&<span className={`absolute -top-2 rounded-full px-2 py-0.5 text-[8px] font-black ${item.gold?"bg-yellow-300 text-black":"bg-pink-500 text-white"}`}>{item.badge}</span>}<div className={`relative grid h-12 w-12 place-items-center rounded-3xl text-2xl ${active?"bg-cyan-400/15 shadow-lg shadow-cyan-400/25":item.gold?"bg-yellow-300/10":"bg-white/5"} ${item.alive?"nav-life":""}`}>{item.icon}</div><div>{item.label}</div></Tap>})}</div></div></nav>;
}

export default function HomePage() {
  const [sloganIndex,setSloganIndex]=useState(0);const [posts,setPosts]=useState([]);const [votes,setVotes]=useState([]);const [user,setUser]=useState(null);const [logoMode,setLogoMode]=useState("idle");const logoTimer=useRef(null);
  function pulseLogo(mode="reward"){clearTimeout(logoTimer.current);setLogoMode(mode);navigator.vibrate?.(mode==="reward"?[10,28,10]:8);logoTimer.current=setTimeout(()=>setLogoMode("idle"),mode==="reward"?900:420)}
  useEffect(()=>{const timer=setInterval(()=>setSloganIndex(i=>(i+1)%slogans.length),2800);loadStats();const onScroll=()=>window.scrollY>30&&pulseLogo("action");window.addEventListener("scroll",onScroll,{passive:true});return()=>{clearInterval(timer);clearTimeout(logoTimer.current);window.removeEventListener("scroll",onScroll)}},[]);
  async function loadStats(){try{const{data:auth}=await supabase.auth.getUser();setUser(auth?.user||null);const[{data:postData},{data:voteData}]=await Promise.all([supabase.from("posts").select("id,user_id,ai_score,boost_score,watch_time_total,shares").limit(120),supabase.from("votes").select("post_id,user_id,value").limit(3000)]);setPosts(postData||[]);setVotes(voteData||[])}catch(err){console.warn("home stats fallback",err)}}
  const stats=useMemo(()=>{const voteMap={};votes.forEach(v=>{if(v?.post_id)voteMap[v.post_id]=(voteMap[v.post_id]||0)+Number(v.value||1)});const scored=posts.map(p=>({...p,score:Number(voteMap[p.id]||0)*12+Number(p.ai_score||50)+Number(p.boost_score||0)*2+Number(p.watch_time_total||0)*2+Number(p.shares||0)*4})).sort((a,b)=>b.score-a.score);const myIndex=user?.id?scored.findIndex(p=>p.user_id===user.id):-1;const me=myIndex>=0?scored[myIndex]:null;const next=myIndex>0?scored[myIndex-1]:null;const gap=next&&me?Math.max(1,Math.ceil((next.score-me.score)/12)):27;const players=Math.max(1,new Set([...posts.map(p=>p.user_id),...votes.map(v=>v.user_id)]).size);return{players,votes:votes.length,pot:Math.round(25+players*.25+votes.length*.05),myRank:myIndex>=0?myIndex+1:1,gap,top5Gap:Math.max(1,gap*7)}} ,[posts,votes,user?.id]);
  const slogan=slogans[sloganIndex];
  return <div className="min-h-screen bg-[#050816] pb-[178px] text-white"><MotionStyles/><div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#082f49_0%,#050816_44%,#02030a_100%)]"/><main className="mx-auto max-w-md px-4 py-5"><header className="flex items-center justify-between gap-3"><BrandLogo mode={logoMode} onPulse={()=>pulseLogo("reward")}/><Tap onPulse={()=>pulseLogo("action")} to="/profile" className="nav-life grid h-14 w-14 shrink-0 place-items-center rounded-[24px] border border-cyan-300/20 bg-white/10 text-3xl shadow-xl">👤</Tap></header><SloganCard slogan={slogan} onPulse={()=>pulseLogo("action")}/><HeroCard onPulse={()=>pulseLogo("reward")}/><section className="mt-8"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-sm font-black uppercase tracking-wide text-cyan-200">🏆 Säännöt heti selväksi</p><h2 className="text-[38px] font-black leading-none">Näin peli toimii</h2></div><Tap onPulse={()=>pulseLogo("reward")} to="/pots" className="rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 px-5 py-3 text-sm font-black text-black shadow-xl shadow-yellow-300/30">Potit →</Tap></div><div className="grid grid-cols-2 gap-3"><RuleCard onPulse={()=>pulseLogo("action")} n="1" icon="✍️" title="Postaa kerran viikossa" text="Yksi hyvä perustelu viikossa pitää kilpailun reiluna." image={IMG.road}/><RuleCard onPulse={()=>pulseLogo("action")} n="2" icon="💗" title="Kerää tykkäyksiä" text="Äänet, katselut ja jaot nostavat scorea." image={IMG.lake}/><RuleCard onPulse={()=>pulseLogo("action")} n="3" icon="💎" title="Päivä, viikko, kuukausi" text="Tilanne näkyy Potit-sivulla live-rankingina." image={IMG.lapland}/><RuleCard onPulse={()=>pulseLogo("action")} n="4" icon="👑" title="Porukat finaaliin" text="Suurimman XP:n porukat etenevät finaaliin." image={IMG.forest}/></div></section><section className="mt-5 grid grid-cols-2 gap-3"><MetricCard hot onPulse={()=>pulseLogo("reward")} title="Päivän potti" value={`${stats.pot}€`} icon="💰" text="Potti kasvaa jokaisesta äänestä!" footerLeft={`👥 ${stats.players}`} footerRight={`♡ ${stats.votes}`} image={IMG.archipelago} to="/pots" progress={30+stats.votes*8}/><MetricCard onPulse={()=>pulseLogo("reward")} title="Oma sijoitus" value={`#${stats.myRank}`} icon="🏅" text={`${stats.top5Gap} ääntä top 5:een`} footerLeft="↗ Nousu" footerRight={`${stats.gap} ääntä`} image={IMG.lake} to="/war" progress={100-stats.gap*2}/></section></main><BottomNav onPulse={()=>pulseLogo("action")}/></div>;
}
