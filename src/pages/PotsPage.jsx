import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200";

const POTS = [
  { key: "daily", title: "Päiväpotti", label: "Päivä", icon: "☀️", base: 25, multiplier: 0.24, glow: "shadow-cyan-400/20", accent: "text-cyan-200", button: "from-cyan-400 to-blue-600" },
  { key: "weekly", title: "Viikkopotti", label: "Viikko", icon: "📅", base: 150, multiplier: 0.72, glow: "shadow-emerald-400/20", accent: "text-emerald-200", button: "from-emerald-300 to-cyan-500" },
  { key: "monthly", title: "Kuukausipotti", label: "Kuukausi", icon: "🏆", base: 500, multiplier: 1.55, glow: "shadow-yellow-300/20", accent: "text-yellow-200", button: "from-yellow-300 to-orange-500" },
  { key: "final", title: "Finaalipotti", label: "Finaali", icon: "💎", base: 2000, multiplier: 3.75, glow: "shadow-fuchsia-400/20", accent: "text-fuchsia-200", button: "from-fuchsia-400 to-blue-600" },
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

function scorePost(post, potKey) {
  const potBoost = potKey === "final" ? 1.35 : potKey === "monthly" ? 1.18 : potKey === "weekly" ? 1.08 : 1;
  return Math.round((Number(post.votes || 0) * 12 + Number(post.ai_score || 0) + Number(post.boost_score || 0) * 2 + Number(post.watch_time_total || 0) * 2 + Number(post.shares || 0) * 4) * potBoost);
}

export default function PotsPage() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveTick, setLiveTick] = useState(0);
  const [reward, setReward] = useState(null);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("pots-four-live-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => handleLive("📝 Uusi postaus mukana poteissa", "success"))
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => handleLive("💗 Ääni muutti leaderboardia", "heavy"))
      .subscribe();

    const interval = setInterval(() => setLiveTick((v) => (v + 1) % 9), 3500);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  function handleLive(text, type) {
    setReward({ id: Date.now(), text });
    setLiveTick((v) => v + 1);
    haptic(type);
    setTimeout(() => setReward(null), 1700);
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
    } catch (error) {
      console.warn("Pots load failed", error);
    } finally {
      setLoading(false);
    }
  }

  const potData = useMemo(() => {
    const voteMap = getVoteCountMap(votes);
    const normalized = (posts || []).map((post) => normalizePost(post, voteMap)).filter(Boolean);
    const playerCount = Math.max(1, new Set([...normalized.map((p) => p.user_id), ...votes.map((v) => v.user_id).filter(Boolean)]).size);

    return POTS.map((pot, index) => {
      const leaderboard = [...normalized]
        .map((post) => ({ ...post, score: scorePost(post, pot.key) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      const liveBump = (liveTick + index) % 5;
      const activity = leaderboard.reduce((sum, post) => sum + Number(post.votes || 0) + Number(post.shares || 0), 0);
      const amount = Math.round(pot.base + playerCount * pot.multiplier + activity * (index + 1) * 0.12 + liveBump);
      return {
        ...pot,
        amount,
        players: playerCount,
        leaderboard,
        fillRate: Math.min(100, Math.max(8, Math.round(playerCount + activity / 2))),
        liveBump,
      };
    });
  }, [posts, votes, liveTick]);

  const total = potData.reduce((sum, pot) => sum + pot.amount, 0);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <style>{`
        @keyframes livePop{0%{transform:scale(.97);opacity:.75}50%{transform:scale(1.025);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes rewardToast{0%{transform:translate(-50%,-12px) scale(.95);opacity:0}15%,85%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-12px) scale(.95);opacity:0}}
        .live-pop{animation:livePop .42s ease both}.reward-toast{animation:rewardToast 1.7s ease both}
      `}</style>

      <img src={BG} alt="" className="fixed inset-0 h-full w-full object-cover" loading="eager" decoding="async" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/35 via-[#061126]/72 to-black/94" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,.18),transparent_36%)]" />

      {reward && <div className="reward-toast fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm rounded-[26px] border border-yellow-300/35 bg-black/80 px-5 py-4 text-center text-sm font-black text-yellow-100 shadow-2xl shadow-yellow-300/20 backdrop-blur-xl">{reward.text}</div>}

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-200">💰 Suomi · porukka · potti</p>
          <h1 className="mt-2 text-[54px] font-black leading-none tracking-tight text-white">Potit</h1>
          <p className="mt-2 text-sm font-bold text-white/62">Kaikki potit, pelaajamäärät ja leaderboardit livenä.</p>
        </header>

        <section className="mt-6 rounded-[38px] border border-yellow-300/25 bg-black/42 p-6 text-center shadow-2xl shadow-yellow-300/20 backdrop-blur-2xl">
          <p className="text-xs font-black uppercase tracking-wide text-yellow-200">Kaikki potit yhteensä</p>
          <div key={total} className="live-pop mt-2 text-[64px] font-black leading-none text-yellow-300">€{total}</div>
          <p className="mt-2 text-sm font-bold text-white/62">{potData[0]?.players || 1} pelaajaa mukana porukassa</p>
        </section>

        {loading && <div className="mt-4 rounded-[30px] border border-white/15 bg-black/42 p-5 text-center font-black backdrop-blur-2xl">Päivitetään potteja...</div>}

        <section className="mt-4 space-y-4">
          {potData.map((pot) => <PotCard key={pot.key} pot={pot} />)}
        </section>

        <div className="mt-4 flex gap-3">
          <Link data-haptic="success" to="/new" className="premium-cta flex-1 rounded-[26px] bg-cyan-500 px-4 py-4 text-center font-black text-white shadow-xl shadow-cyan-500/20">Luo postaus</Link>
          <Link data-haptic="heavy" to="/feed" className="flex-1 rounded-[26px] bg-yellow-300 px-4 py-4 text-center font-black text-black shadow-xl shadow-yellow-300/20">Feed</Link>
        </div>
      </main>

      <AppBottomNav />
    </div>
  );
}

function PotCard({ pot }) {
  const top = pot.leaderboard[0];

  return (
    <article className={`rounded-[34px] border border-white/15 bg-black/42 p-5 shadow-2xl ${pot.glow} backdrop-blur-2xl`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-black uppercase tracking-wide ${pot.accent}`}>{pot.icon} {pot.title}</p>
          <div key={`${pot.key}-${pot.amount}`} className="live-pop mt-2 text-[46px] font-black leading-none text-white">€{pot.amount}</div>
          <p className="mt-2 text-xs font-bold text-white/58">LIVE +€{pot.liveBump} · {pot.players} pelaajaa porukassa</p>
        </div>
        <div className="rounded-[24px] border border-white/12 bg-black/35 px-4 py-3 text-center">
          <div className="text-2xl font-black text-white">{pot.fillRate}%</div>
          <div className="text-[10px] font-black uppercase text-white/45">aktiivisuus</div>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/45">
        <div className={`h-full rounded-full bg-gradient-to-r ${pot.button} transition-all duration-500`} style={{ width: `${pot.fillRate}%` }} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">Leaderboard</h2>
        {top && <span className="rounded-full bg-yellow-300 px-3 py-1 text-[10px] font-black text-black">TOP {Math.round(top.score)}</span>}
      </div>

      <div className="mt-3 space-y-2">
        {pot.leaderboard.length ? pot.leaderboard.map((post, index) => <LeaderRow key={`${pot.key}-${post.id}`} post={post} index={index} />) : (
          <div className="rounded-[22px] border border-white/10 bg-black/30 p-4 text-center text-sm font-black text-white/65">Ei vielä osallistujia tässä potissa.</div>
        )}
      </div>
    </article>
  );
}

function LeaderRow({ post, index }) {
  const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
  return (
    <div className="rounded-[22px] border border-white/10 bg-black/32 p-3">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-sm font-black">{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase text-cyan-100/80">{index === 0 ? "Johtaja" : "Haastaja"}</p>
            <p className="text-xs font-black text-white/55">{Math.round(post.score)} pts</p>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-white/78">{post.content}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black text-white/50">
            <span>💗 {post.votes}</span>
            <span>🤖 {Math.round(post.ai_score)}</span>
            <span>👀 {post.watch_time_total}</span>
            <span>🚀 {post.shares}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
