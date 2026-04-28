import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const POT_CONFIG = {
  daily: {
    title: "Päiväpotti",
    emoji: "☀️",
    base: 25,
    perPlayer: 0.08,
    maxPlayers: 1500,
    description: "Tämän päivän kovin perustelu voittaa.",
  },
  weekly: {
    title: "Viikkopotti",
    emoji: "📆",
    base: 150,
    perPlayer: 0.22,
    maxPlayers: 1500,
    description: "Viikon aikana eniten noussut perustelu.",
  },
  monthly: {
    title: "Kuukausipotti",
    emoji: "🏆",
    base: 500,
    perPlayer: 0.6,
    maxPlayers: 1500,
    description: "Kuukauden paras perustelu ja vahvin kannatus.",
  },
  final: {
    title: "Puolivuosifinaali",
    emoji: "💎",
    base: 2000,
    perPlayer: 2.4,
    maxPlayers: 1500,
    description: "Top pelaajat pääsevät isoon finaaliin.",
  },
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
}

function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 7);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date) {
  const d = startOfMonth(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function startOfHalfYear(date) {
  const d = new Date(date);
  const month = d.getMonth() < 6 ? 0 : 6;
  d.setMonth(month, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfHalfYear(date) {
  const d = startOfHalfYear(date);
  d.setMonth(d.getMonth() + 6);
  return d;
}

function getWindow(type, now = new Date()) {
  if (type === "daily") return { start: startOfDay(now), end: endOfDay(now) };
  if (type === "weekly") return { start: startOfWeek(now), end: endOfWeek(now) };
  if (type === "monthly") return { start: startOfMonth(now), end: endOfMonth(now) };
  return { start: startOfHalfYear(now), end: endOfHalfYear(now) };
}

function formatTimeLeft(endDate, now = new Date()) {
  const ms = Math.max(0, endDate.getTime() - now.getTime());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (days > 0) return `${days} pv ${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} h ${minutes} min ${seconds} s`;
  return `${minutes} min ${seconds} s`;
}

function safeDate(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function normalizePost(post, voteCount = 0) {
  if (!post || typeof post !== "object") return null;
  const id = post.id || post.post_id;
  const content = String(post.content || post.text || post.body || "").trim();
  if (!id || !content) return null;
  return {
    ...post,
    id,
    content,
    user_id: post.user_id || "unknown-user",
    created_at: post.created_at || new Date().toISOString(),
    votes: Number(post.votes || post.vote_count || voteCount || 0),
    vote_count: Number(post.vote_count || post.votes || voteCount || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
  };
}

function scorePost(post) {
  const votes = Number(post.vote_count || post.votes || 0);
  const ai = Number(post.ai_score || 0);
  const growth = Number(post.growth_score || 0);
  const boost = Number(post.boost_score || 0);
  const ageHours = Math.max(1, (Date.now() - safeDate(post.created_at).getTime()) / 3600000);
  const freshness = Math.max(0, 30 - ageHours * 0.35);
  return votes * 12 + ai * 0.45 + growth * 0.35 + boost * 2 + freshness;
}

function buildPeriod(type, posts, now, activePlayers) {
  const config = POT_CONFIG[type];
  const { start, end } = getWindow(type, now);
  const inWindow = posts.filter((post) => {
    const created = safeDate(post.created_at);
    return created >= start && created < end;
  });

  const leaderboard = [...inWindow]
    .map((post) => ({ ...post, pot_score: scorePost(post) }))
    .sort((a, b) => b.pot_score - a.pot_score)
    .slice(0, 10);

  const playerFill = Math.min(config.maxPlayers, Math.max(0, activePlayers));
  const amount = Math.round(config.base + playerFill * config.perPlayer + leaderboard.length * 2);
  const fillRate = Math.round((playerFill / config.maxPlayers) * 100);

  return {
    key: type,
    ...config,
    amount,
    fillRate,
    activePlayers: playerFill,
    timeLeft: formatTimeLeft(end, now),
    endsAt: end,
    leaderboard,
    postCount: inWindow.length,
  };
}

export default function PotsPage() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    const timer = setInterval(() => setNow(new Date()), 1000);
    const channel = supabase
      .channel("realtime-pots-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, load)
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [{ data: postData, error: postError }, { data: voteData, error: voteError }] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("votes").select("post_id,user_id,value,created_at").limit(5000),
      ]);

      if (postError || voteError) throw postError || voteError;

      const voteCounts = {};
      (voteData || []).forEach((vote) => {
        if (!vote?.post_id) return;
        voteCounts[vote.post_id] = (voteCounts[vote.post_id] || 0) + Number(vote.value || 1);
      });

      setVotes(voteData || []);
      setPosts(
        (postData || [])
          .map((post) => normalizePost(post, voteCounts[post.id] || 0))
          .filter(Boolean)
      );
      setError("");
    } catch (err) {
      console.warn("Pots load failed", err);
      setError(err?.message || "Pottien lataus epäonnistui");
    } finally {
      setLoading(false);
    }
  }

  const periods = useMemo(() => {
    const players = new Set();
    posts.forEach((post) => post.user_id && players.add(post.user_id));
    votes.forEach((vote) => vote.user_id && players.add(vote.user_id));
    const activePlayers = Math.max(players.size, posts.length * 8, 1);

    return ["daily", "weekly", "monthly", "final"].map((type) =>
      buildPeriod(type, posts, now, activePlayers)
    );
  }, [posts, votes, now]);

  return (
    <div className="min-h-[100dvh] bg-[#050816] px-4 pb-28 pt-5 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_42%,#02030a_100%)]" />

      <header className="mx-auto max-w-md">
        <Link to="/feed" className="text-xs font-black uppercase tracking-wide text-cyan-200/80">← Takaisin feediin</Link>
        <h1 className="mt-3 text-5xl font-black tracking-tight">💰 Potit</h1>
        <p className="mt-2 text-sm font-bold leading-relaxed text-white/55">
          Reaaliaikaiset potit, leaderboardit ja umpeutumisajat. Potti elää pelaajamäärän ja aktiivisuuden mukaan.
        </p>
      </header>

      {error && <div className="mx-auto mt-5 max-w-md rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>}
      {loading && <div className="mx-auto mt-5 max-w-md rounded-3xl border border-white/10 bg-white/10 p-5 font-black text-white/70">Päivitetään potteja...</div>}

      <main className="mx-auto mt-6 max-w-md space-y-5">
        {periods.map((period) => (
          <PotCard key={period.key} period={period} />
        ))}
      </main>
    </div>
  );
}

function PotCard({ period }) {
  const top = period.leaderboard[0];

  return (
    <section className="overflow-hidden rounded-[34px] border border-white/10 bg-white/10 p-[2px] shadow-2xl backdrop-blur-xl">
      <div className="rounded-[32px] bg-[#111827]/95 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white/50">{period.emoji} {period.title}</p>
            <p className="mt-1 text-5xl font-black text-yellow-300">€{period.amount}</p>
            <p className="mt-2 text-xs font-black text-cyan-200">⏳ Umpeutuu: {period.timeLeft}</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-3 text-center">
            <div className="text-xl font-black text-cyan-100">{period.fillRate}%</div>
            <div className="text-[10px] font-black uppercase text-white/45">täynnä</div>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/35">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-yellow-300 to-pink-400" style={{ width: `${Math.min(100, period.fillRate)}%` }} />
        </div>

        <div className="mt-4 rounded-[24px] border border-yellow-300/20 bg-yellow-300/10 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-yellow-200">Tilanne nyt</p>
          <p className="mt-1 text-sm font-bold leading-relaxed text-white/70">{period.description}</p>
          <p className="mt-2 text-xs font-black text-white/50">👥 {period.activePlayers} / {period.maxPlayers} pelaajaa · 📝 {period.postCount} postausta</p>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Leaderboard</h2>
            {top && <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-black">TOP: {top.vote_count || top.votes || 0} ääntä</span>}
          </div>

          {period.leaderboard.length ? (
            <div className="space-y-3">
              {period.leaderboard.map((post, index) => (
                <LeaderRow key={post.id || index} post={post} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-center">
              <div className="text-4xl">✨</div>
              <p className="mt-2 text-xl font-black">Ei vielä osallistujia</p>
              <p className="mt-1 text-sm font-bold text-white/50">Luo ensimmäinen perustelu ja avaa leaderboard.</p>
              <Link to="/new" className="mt-4 block rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-white">Luo perustelu</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LeaderRow({ post, index }) {
  const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
  const votes = Number(post.vote_count || post.votes || 0);
  const score = Math.round(Number(post.pot_score || 0));

  return (
    <div className="rounded-[24px] border border-white/10 bg-black/25 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-yellow-300 text-sm font-black text-black">{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase text-cyan-200">Pelaaja</p>
            <p className="text-xs font-black text-white/45">Score {score}</p>
          </div>
          <p className="mt-2 line-clamp-3 text-sm font-bold leading-relaxed text-white/75">{post.content}</p>
          <div className="mt-3 flex items-center gap-2 text-xs font-black text-white/55">
            <span>💗 {votes}</span>
            <span>•</span>
            <span>🤖 {Math.round(Number(post.ai_score || 0))}</span>
            <span>•</span>
            <span>{new Date(post.created_at).toLocaleDateString("fi-FI")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
