import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";
import { mergeWithBots, botDrama } from "../lib/bots";
import { buildWinnerRace, getWinnerReason, formatTimeLeft } from "../lib/winnerSystem";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200";
const panel = "premium-card rounded-[34px] p-5";
const innerPanel = "rounded-[24px] border border-cyan-100/10 bg-[#030816]/58 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]";

const POTS = [
  { key: "daily", title: "Päiväpotti", label: "Päivä", icon: "☀️", base: 25, multiplier: 0.24, botMultiplier: 0.18 },
  { key: "weekly", title: "Viikkopotti", label: "Viikko", icon: "📅", base: 150, multiplier: 0.72, botMultiplier: 0.36 },
  { key: "monthly", title: "Kuukausipotti", label: "Kuukausi", icon: "🏆", base: 500, multiplier: 1.55, botMultiplier: 0.72 },
  { key: "final", title: "Finaalipotti", label: "Finaali", icon: "💎", base: 2000, multiplier: 3.75, botMultiplier: 1.35 },
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
    ...post,
    id,
    content,
    user_id: post.user_id || "unknown-user",
    votes: Number(voteMap[id] || post.vote_count || post.votes || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
    watch_time_total: Number(post.watch_time_total || 0),
    shares: Number(post.shares || 0),
    bot: Boolean(post.bot),
    bot_name: post.bot_name,
    bot_avatar: post.bot_avatar,
    bot_heat: Number(post.bot_heat || 0),
    near_win: Boolean(post.near_win),
  };
}

function scorePost(post, potKey) {
  const potBoost = potKey === "final" ? 1.35 : potKey === "monthly" ? 1.18 : potKey === "weekly" ? 1.08 : 1;
  const botBoost = post.bot ? 1.08 : 1;
  return Math.round((Number(post.votes || 0) * 12 + Number(post.ai_score || 0) + Number(post.growth_score || 0) * 0.55 + Number(post.boost_score || 0) * 4 + Number(post.watch_time_total || 0) * 2 + Number(post.shares || 0) * 6 + (post.near_win ? 45 : 0)) * potBoost * botBoost);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => handleLive("Uusi osallistuminen mukana poteissa", "success"))
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => handleLive("Ääni muutti voittajatilannetta", "heavy"))
      .subscribe();
    const interval = setInterval(() => {
      setLiveTick((v) => (v + 1) % 19);
      if (Math.random() > 0.55) setReward({ id: Date.now(), text: "Voittajatilanne päivittyi" });
    }, 3600);
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
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
    } catch (error) { console.warn("Pots load failed", error); }
    finally { setLoading(false); }
  }

  const potData = useMemo(() => {
    const voteMap = getVoteCountMap(votes);
    const realNormalized = (posts || []).map((post) => normalizePost(post, voteMap)).filter(Boolean);
    const normalized = mergeWithBots(realNormalized, 16).map((post) => normalizePost(post, voteMap)).filter(Boolean);
    const botPosts = normalized.filter((p) => p.bot);
    const playerCount = Math.max(1, new Set([...normalized.map((p) => p.user_id), ...votes.map((v) => v.user_id).filter(Boolean)]).size);
    const botHeat = botPosts.reduce((sum, post) => sum + Number(post.bot_heat || 0), 0);
    const drama = botDrama(normalized);

    return POTS.map((pot, index) => {
      const leaderboard = [...normalized].map((post) => ({ ...post, score: scorePost(post, pot.key) })).sort((a, b) => b.score - a.score).slice(0, 5);
      const liveBump = (liveTick + index) % 9;
      const realActivity = leaderboard.filter((p) => !p.bot).reduce((sum, post) => sum + Number(post.votes || 0) + Number(post.shares || 0), 0);
      const botActivity = leaderboard.filter((p) => p.bot).reduce((sum, post) => sum + Number(post.votes || 0) + Number(post.shares || 0) + Number(post.watch_time_total || 0) / 2, 0);
      const botPotBoost = Math.round((botActivity * pot.botMultiplier + botHeat * 0.015) * (index + 1));
      const amount = Math.round(pot.base + playerCount * pot.multiplier + realActivity * (index + 1) * 0.12 + botPotBoost + liveBump);
      const activity = realActivity + botActivity;
      const race = buildWinnerRace(leaderboard, { potKey: pot.key, amount });

      return {
        ...pot,
        amount,
        players: playerCount,
        bots: botPosts.length,
        leaderboard,
        race,
        fillRate: Math.min(100, Math.max(8, Math.round(playerCount + activity / 2))),
        liveBump,
        botPotBoost,
        drama,
      };
    });
  }, [posts, votes, liveTick]);

  const total = potData.reduce((sum, pot) => sum + pot.amount, 0);
  const mainRace = potData.find((p) => p.key === "weekly")?.race || potData[0]?.race;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <style>{`
        @keyframes winnerPulse{0%,100%{box-shadow:0 0 0 rgba(34,211,238,0)}50%{box-shadow:0 0 38px rgba(34,211,238,.28)}}
        @keyframes winnerSweep{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
        @keyframes rewardToast{0%{transform:translate(-50%,-12px) scale(.95);opacity:0}15%,85%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-12px) scale(.95);opacity:0}}
        .winner-pulse{animation:winnerPulse 2.2s ease-in-out infinite}.winner-sweep{animation:winnerSweep 3.8s linear infinite}.reward-toast{animation:rewardToast 1.7s ease both}
      `}</style>
      <img src={BG} alt="" className="fixed inset-0 h-full w-full object-cover" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/42 via-[#061126]/76 to-black/95" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(21,131,255,.16),transparent_34%)]" />

      {reward && <div className="reward-toast fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm rounded-[26px] border border-cyan-200/20 bg-[#030816]/90 px-5 py-4 text-center text-sm font-black text-cyan-100 shadow-2xl shadow-blue-500/10">🏆 {reward.text}</div>}

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/62">Viikon kilpailu</p>
          <h1 className="mt-2 text-[56px] font-black leading-none text-white">Potit</h1>
          <p className="mx-auto mt-2 max-w-[290px] text-sm font-bold leading-snug text-white/62">Yksi osallistuminen. Yksi voittaja. Jokainen ääni voi muuttaa kärkeä.</p>
        </header>

        <section className={`${panel} mt-6 text-center`}>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Kaikki potit yhteensä</p>
          <div className="mt-2 text-[64px] font-black leading-none text-white">€{total}</div>
          {mainRace?.winner && <WinnerHero race={mainRace} />}
        </section>

        {loading && <div className={`${panel} mt-4 text-center font-black`}>Päivitetään voittajatilannetta...</div>}

        <section className="mt-4 space-y-4">{potData.map((pot) => <PotCard key={pot.key} pot={pot} />)}</section>
        <div className="mt-4 flex gap-3">
          <Link data-haptic="success" to="/new" className="flex-1 rounded-[26px] bg-cyan-500 px-4 py-4 text-center font-black text-white">Oma entry</Link>
          <Link data-haptic="heavy" to="/feed" className="flex-1 rounded-[26px] border border-cyan-100/10 bg-[#030816]/70 px-4 py-4 text-center font-black text-white">Feed</Link>
        </div>
      </main>

      <AppBottomNav />
    </div>
  );
}

function WinnerHero({ race }) {
  const winner = race.winner;
  const deadline = race.lockedAt ? formatTimeLeft(new Date(race.lockedAt).getTime() - Date.now()) : "live";
  return (
    <div className="winner-pulse relative mt-5 overflow-hidden rounded-[32px] border border-cyan-200/25 bg-[#030816]/75 p-5 text-left">
      <div className="winner-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-200/10 to-transparent" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/62">Nykyinen voittaja</p>
          <h2 className="mt-1 text-3xl font-black text-white">🏆 {winner.bot ? winner.bot_name : "Pelaaja"}</h2>
          <p className="mt-2 line-clamp-3 text-sm font-bold leading-snug text-white/68">{winner.content}</p>
        </div>
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[24px] border border-cyan-100/15 bg-cyan-300/10 text-xl font-black text-cyan-100">
          {winner.bot ? winner.bot_avatar || "🤖" : "★"}
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-white/[.055] px-2 py-3"><div className="text-lg font-black">{winner.winner_score}</div><div className="text-[9px] font-black uppercase text-white/42">score</div></div>
        <div className="rounded-2xl bg-white/[.055] px-2 py-3"><div className="text-lg font-black">{race.gap || 0}</div><div className="text-[9px] font-black uppercase text-white/42">ero</div></div>
        <div className="rounded-2xl bg-white/[.055] px-2 py-3"><div className="text-lg font-black">{deadline}</div><div className="text-[9px] font-black uppercase text-white/42">jäljellä</div></div>
      </div>
      {race.isClose && race.runnerUp && <div className="relative mt-3 rounded-2xl border border-cyan-100/10 bg-cyan-300/10 px-4 py-3 text-xs font-black text-cyan-100">⚡ Near win: {race.runnerUp.bot ? race.runnerUp.bot_name : "Pelaaja"} on vain {race.gap} pisteen päässä</div>}
    </div>
  );
}

function PotCard({ pot }) {
  return (
    <article className={panel}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-cyan-200">{pot.icon} {pot.title}</p>
          <div className="mt-2 text-[46px] font-black leading-none text-white">€{pot.amount}</div>
          <p className="mt-2 text-xs font-bold text-white/58">LIVE +€{pot.liveBump} · bot boost +€{pot.botPotBoost}</p>
        </div>
        <div className={`${innerPanel} px-4 py-3 text-center`}>
          <div className="text-2xl font-black text-white">{pot.fillRate}%</div>
          <div className="text-[10px] font-black uppercase text-white/45">aktiivisuus</div>
        </div>
      </div>

      {pot.race?.winner && <MiniWinner race={pot.race} />}

      <div className="mt-5 flex items-center justify-between gap-3"><h2 className="text-xl font-black">Leaderboard</h2><span className="rounded-full border border-cyan-100/12 bg-cyan-300/10 px-3 py-1 text-[10px] font-black text-cyan-100">TOP {Math.round(pot.race?.winner?.winner_score || 0)}</span></div>
      <div className="mt-3 space-y-2">{pot.leaderboard.length ? pot.leaderboard.map((post, index) => <LeaderRow key={`${pot.key}-${post.id}`} post={post} index={index} isWinner={pot.race?.winner?.id === post.id} />) : <div className={`${innerPanel} p-4 text-center text-sm font-black text-white/65`}>Ei vielä osallistujia tässä potissa.</div>}</div>
    </article>
  );
}

function MiniWinner({ race }) {
  const winner = race.winner;
  return (
    <div className="winner-pulse mt-4 rounded-[28px] border border-cyan-200/20 bg-[#041226]/76 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/68">Voittaja nyt</p>
          <div className="mt-1 text-lg font-black text-white">🏆 {winner.bot ? winner.bot_name : "Pelaaja"}</div>
        </div>
        <div className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">{winner.winner_score} pts</div>
      </div>
      <p className="mt-2 text-xs font-bold text-white/60">{getWinnerReason(race)}</p>
    </div>
  );
}

function LeaderRow({ post, index, isWinner }) {
  const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
  return (
    <div className={`${innerPanel} ${isWinner ? "border-cyan-200/25 bg-cyan-300/10" : ""} p-3`}>
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[.055] text-sm font-black">{isWinner ? "🏆" : rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase text-cyan-100/80">{post.bot ? `🤖 ${post.bot_name}` : isWinner ? "Voittaja" : "Haastaja"}</p>
            <p className="text-xs font-black text-white/55">{Math.round(post.score || post.winner_score || 0)} pts</p>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-white/78">{post.content}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black text-white/50"><span>♥ {post.votes}</span><span>AI {Math.round(post.ai_score)}</span><span>👀 {post.watch_time_total}</span><span>↗ {post.shares}</span>{isWinner && <span className="text-cyan-100">winner</span>}</div>
        </div>
      </div>
    </div>
  );
}
