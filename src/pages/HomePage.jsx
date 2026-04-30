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
  ["⚡", "ÄÄNESTÄ. NOSTA. VOITA.", "Joka ääni vie sinua lähemmäs pottia."],
  ["🔥", "PÄIVÄN POTTI ELÄÄ.", "Katselut, jaot ja tykkäykset nostavat kierrosta."],
  ["👥", "PORUKKA RATKAISEE.", "Yhdessä kerätty XP vie kohti finaalia."],
  ["🏆", "TOP 5 MENEE FINAALIIN.", "Nouse leaderboardissa ennen kierroksen sulkeutumista."],
];

function MotionStyles() {
  return (
    <style>{`
      @keyframes logoBreath{0%,100%{transform:scale(1);filter:drop-shadow(0 0 10px rgba(34,211,238,.35))}50%{transform:scale(1.018);filter:drop-shadow(0 0 18px rgba(34,211,238,.58))}}
      @keyframes logoBurst{0%{transform:scale(1)}45%{transform:scale(1.055)}100%{transform:scale(1)}}
      @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      .logo-idle{animation:logoBreath 3.2s ease-in-out infinite}.logo-action,.logo-reward{animation:logoBurst .42s ease both}.floaty{animation:floaty 3.2s ease-in-out infinite}.nav-life{animation:logoBreath 3s ease-in-out infinite}
    `}</style>
  );
}

function PhotoLayer({ src, overlay = "linear-gradient(rgba(2,6,23,.18),rgba(2,6,23,.9))", position = "center" }) {
  return <><img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} loading="eager" decoding="async" /><div className="absolute inset-0" style={{ background: overlay }} /></>;
}

function Tap({ children, className = "", to = "/", onPulse }) {
  return <Link to={to} onClick={() => { navigator.vibrate?.(8); onPulse?.(); }} className={className}>{children}</Link>;
}

function KHeartgramLogo({ mode = "idle" }) {
  const cls = mode === "idle" ? "logo-idle" : "logo-action";
  return (
    <div className={`${cls} relative grid h-[74px] w-[74px] shrink-0 place-items-center rounded-[26px] bg-gradient-to-br from-cyan-200 via-blue-400 to-blue-800 shadow-lg shadow-cyan-400/25`}>
      <div className="absolute inset-[5px] rounded-[21px] border border-white/35 bg-[#061126]/20" />
      <svg viewBox="0 0 120 120" className="relative h-[56px] w-[56px] drop-shadow-[0_0_10px_rgba(255,255,255,.45)]">
        <defs><linearGradient id="homeHeartBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#e0fbff"/><stop offset="42%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient></defs>
        <path d="M60 103C48 89 12 72 12 45c0-14 10-24 23-24 11 0 19 7 25 17 6-10 14-17 25-17 13 0 23 10 23 24 0 27-36 44-48 58Z" fill="url(#homeHeartBlue)" opacity=".98" />
        <path d="M35 30h17v28l29-28h23L74 60l34 38H82L52 63v35H35V30Z" fill="white" />
        <rect x="40" y="31" width="10" height="66" rx="4" fill="#0ea5e9" />
      </svg>
    </div>
  );
}

function BrandLogo({ mode = "idle", onPulse }) {
  return (
    <button type="button" onClick={onPulse} className="flex items-center gap-3 text-left">
      <KHeartgramLogo mode={mode} />
      <div className="min-w-0">
        <h1 className="text-[42px] font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-yellow-200">KOLEHTI</h1>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/85">ÄÄNESTÄ · NOSTA · VOITA</p>
      </div>
    </button>
  );
}

function SloganCard({ slogan, onPulse }) {
  return <button type="button" onClick={onPulse} className="relative mt-5 w-full overflow-hidden rounded-[28px] border border-cyan-300/25 p-4 text-left shadow-lg active:scale-[0.99]"><PhotoLayer src={IMG.slogan} overlay="linear-gradient(90deg,rgba(2,6,23,.45),rgba(2,6,23,.86))" /><div className="relative flex items-center gap-4"><div className="floaty text-4xl">{slogan[0]}</div><div><div className="text-[21px] font-black leading-tight text-white">{slogan[1]}</div><div className="mt-1 text-sm font-bold text-white/72">{slogan[2]}</div></div></div></button>;
}

function HeroCard({ onPulse }) {
  return (
    <section className="relative mt-5 overflow-hidden rounded-[38px] border border-cyan-300/25 shadow-lg shadow-cyan-500/10">
      <PhotoLayer src={IMG.helsinki} overlay="linear-gradient(90deg,rgba(2,6,23,.10),rgba(2,6,23,.38),rgba(2,6,23,.88))" position="center" />
      <div className="relative min-h-[370px] p-5">
        <div className="flex items-center justify-between gap-3"><div className="w-fit rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100">🇫🇮 Suomalainen yhteisöpeli</div><div className="rounded-full bg-green-400 px-3 py-1 text-[10px] font-black text-black">LIVE</div></div>
        <div className="mt-16 max-w-[90%]"><p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Tämän päivän kierros</p><h2 className="mt-3 text-[58px] font-black leading-[0.9] tracking-tight text-white">POTTI<br/>AUKI!</h2><p className="mt-5 text-[17px] font-black leading-snug text-white/88">Kirjoita perustelu, kerää ääniä ja nouse mukaan kilpailuun.</p></div>
        <div className="mt-8 grid grid-cols-2 gap-4"><Tap onPulse={onPulse} to="/new" className="rounded-[28px] bg-cyan-500 px-4 py-5 text-center text-base font-black uppercase text-white active:scale-[0.98]">Luo perustelu</Tap><Tap onPulse={onPulse} to="/feed" className="rounded-[28px] border border-white/20 bg-black/30 px-4 py-5 text-center text-base font-black uppercase text-white active:scale-[0.98]">Katso feed</Tap></div>
      </div>
    </section>
  );
}

function RuleCard({ n, icon, title, text, image, onPulse }) {
  return <button type="button" onClick={onPulse} className="relative min-h-[226px] overflow-hidden rounded-[30px] border border-white/10 p-4 text-left shadow-lg transition active:scale-[0.97]"><PhotoLayer src={image} /><div className="relative flex min-h-[194px] flex-col justify-between"><div className="flex items-start justify-between"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-500 text-2xl font-black text-white">{n}</div><div className="text-4xl">{icon}</div></div><div><h3 className="text-[22px] font-black leading-tight text-white">{title}</h3><p className="mt-2 text-[13px] font-bold leading-snug text-white/74">{text}</p></div></div></button>;
}

function MetricCard({ title, value, icon, text, footerLeft, footerRight, image, to, progress, hot, onPulse }) {
  return <Tap onPulse={onPulse} to={to} className={`relative block min-h-[250px] overflow-hidden rounded-[32px] border p-4 shadow-lg active:scale-[0.98] ${hot ? "border-yellow-300/35" : "border-white/10"}`}><PhotoLayer src={image} overlay="linear-gradient(rgba(2,6,23,.12),rgba(2,6,23,.9))" /><div className="relative flex min-h-[218px] flex-col"><div className="flex items-center justify-between"><p className="text-[12px] font-black uppercase tracking-wide text-cyan-200">{title}</p>{hot && <span className="rounded-full bg-yellow-300 px-2 py-1 text-[9px] font-black text-black">HOT</span>}</div><div className="mt-3 text-5xl leading-none">{icon}</div><div className="mt-1 truncate text-[44px] font-black leading-none text-white">{value}</div><p className="mt-3 min-h-[36px] text-[13px] font-bold leading-snug text-white/76">{text}</p><div className="mt-auto h-3 overflow-hidden rounded-full bg-black/45"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-500" style={{ width: `${Math.max(8,Math.min(100,progress))}%` }}/></div><div className="mt-3 grid grid-cols-2 gap-2 text-[12px] font-black text-white/82"><span className="truncate">{footerLeft}</span><span className="truncate text-right">{footerRight}</span></div></div></Tap>;
}

function BottomNav({ onPulse }) {
  const location = useLocation();
  const items = [{to:"/",icon:"⌂",label:"Koti"},{to:"/feed",icon:"🔥",label:"Feed",badge:"LIVE"},{to:"/new",icon:"+",label:"Uusi",fab:true},{to:"/pots",icon:"🏆",label:"Potit",badge:"HOT",gold:true},{to:"/profile",icon:"●",label:"Profiili"}];
  return <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md px-5 pb-4 text-white"><div className="kolehti-bottom-shell relative rounded-[30px] px-4 pb-4 pt-3"><div className="grid grid-cols-5 items-end text-center text-[11px] font-black">{items.map(item=>{const active=location.pathname===item.to;if(item.fab)return <Tap onPulse={onPulse} key={item.to} to={item.to} className="-mt-10 flex flex-col items-center"><div className="grid h-[78px] w-[78px] place-items-center rounded-full border-[6px] border-[#061126] bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-700 text-[54px] font-black shadow-lg">+</div><div className="mt-1 text-white">{item.label}</div></Tap>;return <Tap onPulse={onPulse} key={item.to} to={item.to} className={`relative flex flex-col items-center gap-1 rounded-3xl px-1 py-2 ${active?"text-cyan-200":"text-white/55"}`}>{item.badge&&<span className={`absolute -top-2 rounded-full px-2 py-0.5 text-[8px] font-black ${item.gold?"bg-yellow-300 text-black":"bg-pink-500 text-white"}`}>{item.badge}</span>}<div className={`grid h-10 w-10 place-items-center rounded-2xl text-2xl ${active?"bg-cyan-300/15":"bg-white/5"}`}>{item.icon}</div><div>{item.label}</div></Tap>})}</div></div></nav>;
}

export default function HomePage() {
  const [sloganIndex,setSloganIndex]=useState(0);const [posts,setPosts]=useState([]);const [votes,setVotes]=useState([]);const [user,setUser]=useState(null);const [logoMode,setLogoMode]=useState("idle");const logoTimer=useRef(null);
  function pulseLogo(mode="reward"){clearTimeout(logoTimer.current);setLogoMode(mode);navigator.vibrate?.(mode==="reward"?[10,28,10]:8);logoTimer.current=setTimeout(()=>setLogoMode("idle"),mode==="reward"?900:420)}
  useEffect(()=>{const timer=setInterval(()=>setSloganIndex(i=>(i+1)%slogans.length),2800);loadStats();const onScroll=()=>window.scrollY>30&&pulseLogo("action");window.addEventListener("scroll",onScroll,{passive:true});return()=>{clearInterval(timer);clearTimeout(logoTimer.current);window.removeEventListener("scroll",onScroll)}},[]);
  async function loadStats(){try{const{data:auth}=await supabase.auth.getUser();setUser(auth?.user||null);const[{data:postData},{data:voteData}]=await Promise.all([supabase.from("posts").select("id,user_id,ai_score,boost_score,watch_time_total,shares").limit(120),supabase.from("votes").select("post_id,user_id,value").limit(3000)]);setPosts(postData||[]);setVotes(voteData||[])}catch(err){console.warn("home stats fallback",err)}}
  const stats=useMemo(()=>{const voteMap={};votes.forEach(v=>{if(v?.post_id)voteMap[v.post_id]=(voteMap[v.post_id]||0)+Number(v.value||1)});const scored=posts.map(p=>({...p,score:Number(voteMap[p.id]||0)*12+Number(p.ai_score||50)+Number(p.boost_score||0)*2+Number(p.watch_time_total||0)*2+Number(p.shares||0)*4})).sort((a,b)=>b.score-a.score);const myIndex=user?.id?scored.findIndex(p=>p.user_id===user.id):-1;const me=myIndex>=0?scored[myIndex]:null;const next=myIndex>0?scored[myIndex-1]:null;const gap=next&&me?Math.max(1,Math.ceil((next.score-me.score)/12)):27;const players=Math.max(1,new Set([...posts.map(p=>p.user_id),...votes.map(v=>v.user_id)]).size);return{players,votes:votes.length,pot:Math.round(25+players*.25+votes.length*.05),myRank:myIndex>=0?myIndex+1:1,gap,top5Gap:Math.max(1,gap*7)}} ,[posts,votes,user?.id]);
  const slogan=slogans[sloganIndex];
  return <div className="min-h-screen bg-[#050816] pb-[178px] text-white"><MotionStyles/><div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#082f49_0%,#050816_44%,#02030a_100%)]"/><main className="mx-auto max-w-md px-4 py-5"><header className="flex items-center justify-between gap-3"><BrandLogo mode={logoMode} onPulse={()=>pulseLogo("reward")}/><Tap onPulse={()=>pulseLogo("action")} to="/profile" className="nav-life grid h-14 w-14 shrink-0 place-items-center rounded-[24px] border border-cyan-300/20 bg-white/10 text-3xl shadow-lg">👤</Tap></header><SloganCard slogan={slogan} onPulse={()=>pulseLogo("action")}/><HeroCard onPulse={()=>pulseLogo("reward")}/><section className="mt-8"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-sm font-black uppercase tracking-wide text-cyan-200">🏆 Säännöt heti selväksi</p><h2 className="text-[38px] font-black leading-none">Näin peli toimii</h2></div><Tap onPulse={()=>pulseLogo("reward")} to="/pots" className="rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 px-5 py-3 text-sm font-black text-black shadow-lg">Potit →</Tap></div><div className="grid grid-cols-2 gap-3"><RuleCard onPulse={()=>pulseLogo("action")} n="1" icon="✍️" title="Postaa kerran viikossa" text="Yksi hyvä perustelu viikossa pitää kilpailun reiluna." image={IMG.road}/><RuleCard onPulse={()=>pulseLogo("action")} n="2" icon="💗" title="Kerää tykkäyksiä" text="Äänet, katselut ja jaot nostavat scorea." image={IMG.lake}/><RuleCard onPulse={()=>pulseLogo("action")} n="3" icon="💎" title="Päivä, viikko, kuukausi" text="Tilanne näkyy Potit-sivulla live-rankingina." image={IMG.lapland}/><RuleCard onPulse={()=>pulseLogo("action")} n="4" icon="👑" title="Porukat finaaliin" text="Suurimman XP:n porukat etenevät finaaliin." image={IMG.forest}/></div></section><section className="mt-5 grid grid-cols-2 gap-3"><MetricCard hot onPulse={()=>pulseLogo("reward")} title="Päivän potti" value={`${stats.pot}€`} icon="💰" text="Potti kasvaa jokaisesta äänestä!" footerLeft={`👥 ${stats.players}`} footerRight={`♡ ${stats.votes}`} image={IMG.archipelago} to="/pots" progress={30+stats.votes*8}/><MetricCard onPulse={()=>pulseLogo("reward")} title="Oma sijoitus" value={`#${stats.myRank}`} icon="🏅" text={`${stats.top5Gap} ääntä top 5:een`} footerLeft="↗ Nousu" footerRight={`${stats.gap} ääntä`} image={IMG.lake} to="/war" progress={100-stats.gap*2}/></section></main><BottomNav onPulse={()=>pulseLogo("action")}/></div>;
}
