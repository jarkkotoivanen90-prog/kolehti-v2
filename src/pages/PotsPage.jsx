import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";

const POTS = [
  { key: "daily", title: "Päiväpotti", short: "Päivä", emoji: "☀️", base: 25, multiplier: 0.2, accent: "from-cyan-300 via-sky-400 to-blue-600" },
  { key: "weekly", title: "Viikkopotti", short: "Viikko", emoji: "📅", base: 150, multiplier: 0.6, accent: "from-emerald-300 via-cyan-300 to-sky-500" },
  { key: "monthly", title: "Kuukausipotti", short: "Kuukausi", emoji: "🏆", base: 500, multiplier: 1.4, accent: "from-yellow-200 via-yellow-300 to-orange-500" },
  { key: "final", title: "Finaalipotti", short: "Finaali", emoji: "💎", base: 2000, multiplier: 3.5, accent: "from-fuchsia-300 via-cyan-300 to-blue-500" },
];

function getVoteCountMap(votes) {
  const map = {};
  (votes || []).forEach((vote) => {
    if (!vote?.post_id) return;
    map[vote.post_id] = (map[vote.post_id] || 0) + Number(vote.value || 1);
  });
  return map;
}

function normalizePost(post, voteMap) {
  if (!post || typeof post !== "object") return null;
  const id = post.id || post.post_id;
  const content = String(post.content || post.text || post.body || "").trim();
  if (!id || !content) return null;
  return {
    id,
    content,
    user_id: post.user_id || "unknown-user",
    votes: Number(voteMap[id] || post.vote_count || post.votes || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    boost_score: Number(post.boost_score || 0),
    watch_time_total: Number(post.watch_time_total || 0),
    shares: Number(post.shares || 0),
  };
}

function scorePost(post) {
  return Math.round(Number(post.votes || 0) * 12 + Number(post.ai_score || 0) + Number(post.boost_score || 0) * 2 + Number(post.watch_time_total || 0) * 2 + Number(post.shares || 0) * 4);
}

function getNearWinState(pot) {
  const leader = pot?.leaderboard?.[0];
  const second = pot?.leaderboard?.[1];
  if (!leader) return { level: "empty", text: "Ensimmäinen perustelu voi ottaa potin haltuun.", gap: null };
  if (!second) return { level: "leader", text: "🏆 Johtaja pitää pottia — haasta kärki nyt.", gap: null };
  const gap = Math.max(1, Math.abs(Number(leader.score || 0) - Number(second.score || 0)));
  if (gap <= 12) return { level: "critical", text: "🔥 Kärki on täysin auki — yksi ääni voi vaihtaa johtajan.", gap };
  if (gap <= 35) return { level: "hot", text: `⚡ Ero kärkeen vain ${gap} pistettä.`, gap };
  return { level: "normal", text: "🎯 Hyvä perustelu voi hypätä suoraan kärkeen.", gap };
}

export default function PotsPage() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [activeTab, setActiveTab] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(0);
  const [liveAmountBump, setLiveAmountBump] = useState(0);
  const [pressureIndex, setPressureIndex] = useState(0);
  const [reward, setReward] = useState(null);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("pots-page-near-win-loop")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => handleLiveEvent("📝 Uusi perustelu mukana potissa", "success"))
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => handleLiveEvent("💗 Uusi ääni muutti kilpailua", "heavy"))
      .subscribe();

    const drip = setInterval(() => {
      setPressureIndex((v) => v + 1);
      setLiveAmountBump((v) => (v + 1) % 4);
    }, 4500);

    return () => {
      clearInterval(drip);
      supabase.removeChannel(channel);
    };
  }, []);

  function handleLiveEvent(text, type = "success") {
    setPulse((v) => v + 1);
    setLiveAmountBump((v) => v + 1);
    setReward({ id: Date.now(), text });
    haptic(type);
    setTimeout(() => setReward(null), 1850);
    load();
  }

  async function load() {
    setLoading(true);
    try {
      const [{ data: postData }, { data: voteData }] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("votes").select("post_id,user_id,value,created_at").limit(3000),
      ]);
      setPosts(postData || []);
      setVotes(voteData || []);
    } catch (err) {
      console.warn("Pots load failed", err);
    } finally {
      setLoading(false);
    }
  }

  const data = useMemo(() => {
    const voteMap = getVoteCountMap(votes);
    const normalized = (posts || []).map((post) => normalizePost(post, voteMap)).filter(Boolean);
    const activePlayers = Math.max(1, new Set([...normalized.map((p) => p.user_id), ...votes.map((v) => v.user_id).filter(Boolean)]).size);

    return POTS.map((pot) => {
      const leaderboard = [...normalized].map((post) => ({ ...post, score: scorePost(post) })).sort((a, b) => b.score - a.score).slice(0, 5);
      const nearWin = getNearWinState({ leaderboard });
      return {
        ...pot,
        amount: Math.round(pot.base + activePlayers * pot.multiplier + leaderboard.length * 2),
        activePlayers,
        leaderboard,
        nearWin,
        fillRate: Math.min(100, Math.max(8, Math.round((activePlayers / 100) * 100))),
      };
    });
  }, [posts, votes]);

  const activePot = data.find((pot) => pot.key === activeTab) || data[0];
  const totalAmount = data.reduce((sum, pot) => sum + pot.amount, 0) + liveAmountBump;
  const topLeader = activePot?.leaderboard?.[0];
  const pressureMessages = [
    activePot?.nearWin?.text || "Kilpailu elää.",
    `👀 ${activePot?.activePlayers || 1} pelaajaa seuraa pottia.`,
    "💥 Jokainen ääni nostaa painetta leaderboardissa.",
    "🎯 Tee seuraava liike: luo perustelu tai hae ääniä.",
  ];
  const pressure = pressureMessages[pressureIndex % pressureMessages.length];

  return (
    <div className="min-h-[100dvh] bg-[#050816] px-4 pb-[150px] pt-5 text-white">
      <style>{`
        @keyframes potPulse{0%,100%{transform:scale(1);box-shadow:0 0 30px rgba(250,204,21,.34)}50%{transform:scale(1.04);box-shadow:0 0 58px rgba(250,204,21,.68)}}
        @keyframes livePop{0%{transform:scale(.96);opacity:.65}45%{transform:scale(1.035);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes nearWinPulse{0%,100%{box-shadow:0 0 20px rgba(250,204,21,.22);transform:scale(1)}50%{box-shadow:0 0 48px rgba(250,204,21,.55);transform:scale(1.015)}}
        @keyframes rewardToast{0%{transform:translate(-50%,-12px) scale(.95);opacity:0}15%,85%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-12px) scale(.95);opacity:0}}
        .pot-logo{animation:potPulse 2.7s ease-in-out infinite}.live-pop{animation:livePop .42s ease both}.near-win-pulse{animation:nearWinPulse 1.8s ease-in-out infinite}.reward-toast{animation:rewardToast 1.85s ease both}
      `}</style>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#14366f_0%,#050816_44%,#02030a_100%)]" />

      {reward && <div className="reward-toast fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm rounded-[26px] border border-yellow-300/35 bg-black/80 px-5 py-4 text-center text-sm font-black text-yellow-100 shadow-2xl shadow-yellow-300/20 backdrop-blur-xl">{reward.text}</div>}

      <main className="mx-auto max-w-md">
        <header className="text-center">
          <Link data-haptic="tap" to="/feed" className="mb-4 inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white/70">← Feed</Link>
          <div className="pot-logo mx-auto grid h-[108px] w-[108px] place-items-center rounded-[38px] border border-yellow-100/50 bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-500 text-[58px] shadow-2xl shadow-yellow-300/40">💰</div>
          <h1 className="mt-4 bg-gradient-to-r from-yellow-100 via-white to-yellow-300 bg-clip-text text-[58px] font-black leading-none tracking-tight text-transparent">Potit</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm font-bold leading-snug text-white/55">Valitse potti, seuraa kärkeä ja nouse mukaan kilpailuun.</p>
        </header>

        <section className="suomi-card suomi-archipelago suomi-premium mt-6 rounded-[38px] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-200">Kaikki potit yhteensä</p>
            <span key={pulse} className="live-pop rounded-full bg-green-400 px-3 py-1 text-[10px] font-black text-black">LIVE +€{liveAmountBump}</span>
          </div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="min-w-0"><p key={totalAmount} className="live-pop truncate text-[64px] font-black leading-none text-yellow-300">€{totalAmount}</p><p className="mt-2 text-xs font-black text-white/55">Päivä · viikko · kuukausi · finaali</p></div>
            <div className="shrink-0 rounded-3xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-3 text-center"><div className="text-2xl font-black text-cyan-200">{activePot?.activePlayers || 1}</div><div className="text-[10px] font-black uppercase text-white/55">pelaajaa</div></div>
          </div>
          {topLeader && <p className="mt-4 rounded-2xl bg-black/35 p-3 text-xs font-black leading-snug text-white/75">🏆 Kärjessä nyt: {topLeader.content.slice(0, 80)}...</p>}
        </section>

        <section className={`mt-4 rounded-[28px] border p-4 text-center shadow-xl backdrop-blur-xl ${activePot?.nearWin?.level === "critical" ? "near-win-pulse border-yellow-300/45 bg-yellow-300/12" : "border-cyan-300/20 bg-cyan-300/10"}`}>
          <p key={pressureIndex} className="live-pop text-sm font-black leading-snug text-cyan-50">{pressure}</p>
        </section>

        <PotSelector data={data} activeTab={activeTab} setActiveTab={setActiveTab} />
        {loading && <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5 text-center font-black text-white/70">Päivitetään potteja...</div>}
        {activePot && <ActivePotCard pot={activePot} pulse={pulse} />}
      </main>

      <AppBottomNav />
    </div>
  );
}

function PotSelector({ data, activeTab, setActiveTab }) {
  return (
    <section className="mt-6 grid grid-cols-2 gap-3">
      {data.map((pot) => {
        const active = activeTab === pot.key;
        return (
          <button data-haptic={active ? "soft" : "success"} key={pot.key} onClick={() => { haptic(active ? "soft" : "success"); setActiveTab(pot.key); }} className={`rounded-[30px] border p-4 text-left transition active:scale-[0.98] ${active ? `border-white/45 bg-gradient-to-br ${pot.accent} text-black shadow-2xl shadow-cyan-400/25 scale-[1.02]` : "border-white/10 bg-white/8 text-white shadow-xl"}`}>
            <div className="flex items-center justify-between gap-2"><div className="text-4xl">{pot.emoji}</div>{active && <div className="rounded-full bg-black/20 px-3 py-1 text-[10px] font-black text-black">VALITTU</div>}</div>
            <div className={`mt-3 text-xs font-black uppercase tracking-wide ${active ? "text-black/65" : "text-white/45"}`}>{pot.title}</div>
            <div className={`mt-1 text-[34px] font-black leading-none ${active ? "text-black" : "text-yellow-300"}`}>€{pot.amount}</div>
            <div className={`mt-3 h-3 overflow-hidden rounded-full ${active ? "bg-black/25" : "bg-black/35"}`}><div className={`h-full rounded-full ${active ? "bg-white" : "bg-cyan-300"}`} style={{ width: `${pot.fillRate}%` }} /></div>
          </button>
        );
      })}
    </section>
  );
}

function ActivePotCard({ pot, pulse }) {
  const nearWin = pot.nearWin?.level === "critical" || pot.nearWin?.level === "hot";
  return (
    <section className={`mt-6 overflow-hidden rounded-[38px] bg-gradient-to-br ${pot.accent} p-[2px] shadow-2xl shadow-cyan-400/10 ${nearWin ? "near-win-pulse" : ""}`}>
      <div className="rounded-[36px] bg-[#09111f]/95 p-5">
        {nearWin && <div className="live-pop mb-4 rounded-[24px] border border-yellow-300/35 bg-yellow-300/12 px-4 py-3 text-center text-sm font-black text-yellow-100">🔥 {pot.nearWin.text}</div>}
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black text-cyan-100">{pot.emoji} {pot.title}</p><p key={`${pot.key}-${pulse}`} className="live-pop mt-1 text-[60px] font-black leading-none text-white">€{pot.amount}</p><p className="mt-2 text-xs font-black text-white/45">Potti kasvaa aktiivisuuden mukaan</p></div><div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-3 text-center"><div className="text-xl font-black text-white">{pot.fillRate}%</div><div className="text-[10px] font-black uppercase text-white/45">täynnä</div></div></div>
        <div className="mt-5 h-4 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${pot.fillRate}%` }} /></div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black"><div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Pelaajat</div><div className="mt-1 text-xl">{pot.activePlayers}</div></div><div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Kärki</div><div className="mt-1 text-xl">{pot.leaderboard[0]?.score || 0}</div></div><div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Postit</div><div className="mt-1 text-xl">{pot.leaderboard.length}</div></div></div>
        <div className="mt-5 flex gap-3"><Link data-haptic="success" to="/new" className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 text-center text-sm font-black text-white shadow-xl shadow-cyan-400/20">Luo perustelu</Link><Link data-haptic="heavy" to="/feed" className="flex-1 rounded-2xl bg-yellow-300 px-4 py-3 text-center text-sm font-black text-black shadow-xl shadow-yellow-300/20">Hae ääniä</Link></div>
        <div className="mt-5"><div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">Leaderboard</h2>{pot.leaderboard[0] && <span className="rounded-full bg-yellow-300 px-3 py-1 text-[10px] font-black text-black">TOP {pot.leaderboard[0].score}</span>}</div>{pot.leaderboard.length ? <div className="mt-3 space-y-3">{pot.leaderboard.map((post, index) => <LeaderRow key={post.id} post={post} index={index} />)}</div> : <div className="mt-3 rounded-[24px] border border-white/10 bg-black/20 p-5 text-center"><div className="text-4xl">✨</div><p className="mt-2 text-xl font-black">Ei vielä osallistujia</p><Link to="/new" className="mt-4 block rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-white">Luo perustelu</Link></div>}</div>
      </div>
    </section>
  );
}

function LeaderRow({ post, index }) {
  const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
  return <div className={`rounded-[26px] border p-4 transition ${index === 0 ? "border-yellow-300/35 bg-yellow-300/10" : "border-white/10 bg-black/25"}`}><div className="flex items-start gap-3"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-yellow-300 text-lg font-black text-black">{rank}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase text-cyan-200">{index === 0 ? "Johtaja" : "Haastaja"}</p><p className="text-sm font-black text-white/55">Score {Math.round(post.score)}</p></div><p className="mt-2 line-clamp-3 text-base font-black leading-relaxed text-white/75">{post.content}</p><div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-white/55"><span>💗 {post.votes}</span><span>🤖 {Math.round(post.ai_score)}</span><span>👀 {post.watch_time_total}</span><span>🚀 {post.shares}</span></div></div></div></div>;
}
