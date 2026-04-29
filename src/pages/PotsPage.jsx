import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const POTS = [
  { key: "daily", title: "Päiväpotti", emoji: "☀️", base: 25, multiplier: 0.2, endsIn: "Tänään", accent: "from-cyan-300 to-blue-500" },
  { key: "weekly", title: "Viikkopotti", emoji: "📆", base: 150, multiplier: 0.6, endsIn: "Tällä viikolla", accent: "from-emerald-300 to-cyan-500" },
  { key: "monthly", title: "Kuukausipotti", emoji: "🏆", base: 500, multiplier: 1.4, endsIn: "Tässä kuussa", accent: "from-yellow-300 to-orange-500" },
  { key: "final", title: "Finaalipotti", emoji: "💎", base: 2000, multiplier: 3.5, endsIn: "Puolivuosifinaali", accent: "from-fuchsia-300 to-cyan-400" },
];

function safeText(value) {
  return String(value || "").trim();
}

function getVoteCountMap(votes) {
  const map = {};
  (votes || []).forEach((vote) => {
    if (!vote?.post_id) return;
    map[vote.post_id] = (map[vote.post_id] || 0) + Number(vote.value || 1);
  });
  return map;
}

function getEndDate(type) {
  const now = new Date();
  const end = new Date(now);
  if (type === "daily") {
    end.setHours(24, 0, 0, 0);
  } else if (type === "weekly") {
    const day = end.getDay() || 7;
    end.setDate(end.getDate() + (7 - day + 1));
    end.setHours(0, 0, 0, 0);
  } else if (type === "monthly") {
    end.setMonth(end.getMonth() + 1, 1);
    end.setHours(0, 0, 0, 0);
  } else {
    const nextHalf = end.getMonth() < 6 ? 6 : 12;
    end.setMonth(nextHalf, 1);
    end.setHours(0, 0, 0, 0);
  }
  return end;
}

function getTimeLeftParts(type) {
  const now = new Date();
  const end = getEndDate(type);
  const ms = Math.max(0, end.getTime() - now.getTime());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const totalSeconds = Math.floor(ms / 1000);
  const label = days > 0 ? `${days} pv ${hours} h` : hours > 0 ? `${hours} h ${minutes} min ${seconds} s` : `${minutes} min ${seconds} s`;
  return { label, totalSeconds };
}

function normalizePost(post, voteMap) {
  if (!post || typeof post !== "object") return null;
  const id = post.id || post.post_id;
  const content = safeText(post.content || post.text || post.body);
  if (!id || !content) return null;
  return {
    id,
    content,
    user_id: post.user_id || "unknown-user",
    created_at: post.created_at || new Date().toISOString(),
    votes: Number(voteMap[id] || post.vote_count || post.votes || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    boost_score: Number(post.boost_score || 0),
    watch_time_total: Number(post.watch_time_total || 0),
    shares: Number(post.shares || 0),
  };
}

function scorePost(post, boostActive = false) {
  const viral = 1 + Math.min(0.7, Number(post.shares || 0) * 0.04 + Number(post.watch_time_total || 0) * 0.01);
  const boostMultiplier = boostActive ? 2 : 1;
  return Math.round((Number(post.votes || 0) * 12 + Number(post.ai_score || 0) + Number(post.boost_score || 0) * 2 + Number(post.watch_time_total || 0) * 2) * viral * boostMultiplier);
}

function getStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const saved = JSON.parse(localStorage.getItem("kolehti_pot_streak") || "{}");
    if (saved.date === today) return Number(saved.count || 1);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const next = saved.date === yesterday ? Number(saved.count || 0) + 1 : 1;
    localStorage.setItem("kolehti_pot_streak", JSON.stringify({ date: today, count: next }));
    return next;
  } catch {
    return 1;
  }
}

export default function PotsPage() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveEvent, setLiveEvent] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState("daily");
  const [boostActive, setBoostActive] = useState(false);
  const [winnerReveal, setWinnerReveal] = useState(null);
  const [streak, setStreak] = useState(1);
  const previousTopRef = useRef({});
  const previousMyRankRef = useRef(null);
  const rewardCooldownRef = useRef({});
  const winnerShownRef = useRef({});

  function fireEvent(type, emoji, text, force = false) {
    const current = Date.now();
    if (!force && rewardCooldownRef.current[type] && current - rewardCooldownRef.current[type] < 6500) return;
    rewardCooldownRef.current[type] = current;
    setLiveEvent({ id: `${current}-${Math.random()}`, emoji, text });
    setActivity((prev) => [{ id: `${current}-${Math.random()}`, text: `${emoji} ${text}` }, ...prev.slice(0, 4)]);
    navigator.vibrate?.([10, 25, 10]);
    setTimeout(() => setLiveEvent(null), 1800);
  }

  useEffect(() => {
    setStreak(getStreak());
    load();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const boostTimer = setInterval(() => {
      setBoostActive(true);
      fireEvent("boost-window", "🔥", "2X boost ikkuna aktiivinen", true);
      setTimeout(() => setBoostActive(false), 30000);
    }, 90000);
    const channel = supabase
      .channel("pot-v2-insanity")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fireEvent("post", "📝", "Uusi perustelu mukana poteissa");
        load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        fireEvent("vote", "💗", "Uusi ääni päivitti potit");
        load();
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      clearInterval(boostTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      setUser(auth?.user || null);

      const [{ data: postData, error: postError }, { data: voteData, error: voteError }] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("votes").select("post_id,user_id,value,created_at").limit(3000),
      ]);

      if (postError || voteError) throw postError || voteError;

      setPosts(postData || []);
      setVotes(voteData || []);
      setError("");
    } catch (err) {
      console.warn("Pots load failed", err);
      setError(err?.message || "Pottien lataus epäonnistui");
    } finally {
      setLoading(false);
    }
  }

  const data = useMemo(() => {
    const voteMap = getVoteCountMap(votes);
    const normalized = (posts || []).map((post) => normalizePost(post, voteMap)).filter(Boolean);
    const activePlayers = Math.max(1, new Set([...normalized.map((p) => p.user_id), ...votes.map((v) => v.user_id).filter(Boolean)]).size);

    return POTS.map((pot) => {
      const time = getTimeLeftParts(pot.key);
      const leaderboard = [...normalized]
        .map((post) => ({ ...post, score: scorePost(post, boostActive) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      const myIndex = user?.id ? leaderboard.findIndex((post) => post.user_id === user.id) : -1;
      const me = myIndex >= 0 ? leaderboard[myIndex] : null;
      const ahead = myIndex > 0 ? leaderboard[myIndex - 1] : null;
      const scoreGap = ahead && me ? Math.max(1, Math.ceil(ahead.score - me.score + 1)) : 0;
      const likesNeeded = scoreGap ? Math.max(1, Math.ceil(scoreGap / 12)) : 0;
      const oneLikeScore = me ? me.score + 12 : 0;
      const overtakes = me ? leaderboard.slice(0, myIndex).filter((post) => oneLikeScore > post.score).length : 0;
      const topGap = leaderboard.length > 1 ? Math.abs(Number(leaderboard[0].score || 0) - Number(leaderboard[1].score || 0)) : 999;

      return {
        ...pot,
        amount: Math.round(pot.base + activePlayers * pot.multiplier + leaderboard.length * 2 + (boostActive ? 10 : 0)),
        fillRate: Math.min(100, Math.round((activePlayers / 1500) * 100)),
        activePlayers,
        leaderboard,
        myRank: myIndex >= 0 ? myIndex + 1 : null,
        myGap: scoreGap,
        likesNeeded,
        overtakes,
        timeLeft: time.label,
        timeLeftSeconds: time.totalSeconds,
        isNearWin: topGap < 15,
        oneLikeToWin: myIndex === 1 && scoreGap <= 12,
        isClutch: time.totalSeconds > 0 && time.totalSeconds <= 10,
      };
    });
  }, [posts, votes, user?.id, now, boostActive]);

  useEffect(() => {
    data.forEach((pot) => {
      const top = pot.leaderboard[0];
      if (top) {
        const oldTop = previousTopRef.current[pot.key];
        if (oldTop && oldTop !== top.id) fireEvent(`leader-${pot.key}`, "🔥", `${pot.title}: johtaja vaihtui`);
        previousTopRef.current[pot.key] = top.id;
      }
      if (pot.overtakes > 0) fireEvent(`overtake-${pot.key}`, "🎯", `${pot.title}: 1 like voi ohittaa ${pot.overtakes} pelaajaa`);
      if (pot.oneLikeToWin) fireEvent(`one-like-${pot.key}`, "🚀", `${pot.title}: yksi like voi nostaa voittoon`, true);
      if (pot.isClutch) fireEvent(`clutch-${pot.key}`, "⏳", `${pot.title}: clutch time`, true);
      if (pot.timeLeftSeconds <= 0 && top && !winnerShownRef.current[pot.key]) {
        winnerShownRef.current[pot.key] = true;
        setWinnerReveal({ pot, winner: top });
        navigator.vibrate?.([20, 40, 20, 40]);
        setTimeout(() => setWinnerReveal(null), 3500);
      }
    });

    const activePot = data.find((pot) => pot.key === activeTab);
    if (activePot?.myRank) {
      const previous = previousMyRankRef.current;
      if (previous && activePot.myRank > previous) fireEvent("rival", "⚔️", "Sinut ohitettiin tässä potissa", true);
      previousMyRankRef.current = activePot.myRank;
    }
  }, [data, activeTab]);

  const activePot = data.find((pot) => pot.key === activeTab) || data[0];
  const totalAmount = data.reduce((sum, pot) => sum + pot.amount, 0);
  const topLeader = data.map((pot) => pot.leaderboard[0]).filter(Boolean).sort((a, b) => b.score - a.score)[0];
  const anyClutch = data.some((pot) => pot.isClutch);

  return (
    <div className="min-h-[100dvh] bg-[#050816] px-4 pb-28 pt-5 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_44%,#02030a_100%)]" />
      {liveEvent && <LiveEvent event={liveEvent} />}
      {winnerReveal && <WinnerReveal reveal={winnerReveal} />}
      {anyClutch && <ClutchOverlay />}
      {boostActive && <BoostBadge />}

      <header className="mx-auto max-w-md">
        <div className="flex items-center justify-between gap-3">
          <Link to="/feed" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white/70">← Feed</Link>
          <Link to="/war" className="rounded-2xl bg-yellow-300 px-4 py-3 text-xs font-black text-black">War</Link>
        </div>
        <h1 className="mt-5 text-5xl font-black tracking-tight">💰 Potit</h1>
        <p className="mt-2 text-sm font-bold leading-relaxed text-white/55">Pot v2: near-win glow, boost window, winner reveal ja live battle -tunnelma.</p>
      </header>

      <section className="mx-auto mt-5 max-w-md overflow-hidden rounded-[38px] border border-yellow-300/25 bg-gradient-to-br from-yellow-300/20 via-cyan-400/10 to-pink-500/10 p-[2px] shadow-2xl">
        <div className="rounded-[36px] bg-[#0b1225]/95 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-wide text-yellow-200">Kaikki potit yhteensä</p>
            <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-[10px] font-black text-cyan-100">🔥 Streak x{streak}</span>
          </div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <p className="text-6xl font-black text-yellow-300">€{totalAmount}</p>
              <p className="mt-1 text-xs font-black text-white/45">Päivä · viikko · kuukausi · finaali</p>
            </div>
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-center">
              <div className="text-2xl font-black text-cyan-200">{data[0]?.activePlayers || 1}</div>
              <div className="text-[10px] font-black uppercase text-white/45">pelaajaa</div>
            </div>
          </div>
          {topLeader && <p className="mt-4 rounded-2xl bg-black/25 p-3 text-xs font-black text-white/65">🏆 Kärjessä nyt: {topLeader.content.slice(0, 70)}...</p>}
        </div>
      </section>

      <PotTabs data={data} activeTab={activeTab} setActiveTab={setActiveTab} />
      <LiveTicker activity={activity} />

      {error && <div className="mx-auto mt-5 max-w-md rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>}
      {loading && <div className="mx-auto mt-5 max-w-md rounded-3xl border border-white/10 bg-white/10 p-5 font-black text-white/70">Päivitetään potteja...</div>}

      <main className="mx-auto mt-6 max-w-md space-y-5">
        {activePot && <PotCard pot={activePot} user={user} boostActive={boostActive} />}
        <section className="grid grid-cols-2 gap-3">
          {data.filter((pot) => pot.key !== activeTab).map((pot) => <MiniPot key={pot.key} pot={pot} onClick={() => setActiveTab(pot.key)} />)}
        </section>
      </main>
    </div>
  );
}

function LiveEvent({ event }) {
  return (
    <div className="fixed left-1/2 top-20 z-[80] w-[calc(100%-32px)] max-w-sm -translate-x-1/2">
      <div className="rounded-[28px] border border-cyan-300/30 bg-black/75 px-5 py-4 text-center font-black text-white shadow-2xl backdrop-blur-xl">
        <div className="text-3xl">{event.emoji}</div>
        <div className="mt-1 text-sm leading-tight">{event.text}</div>
      </div>
    </div>
  );
}

function BoostBadge() {
  return <div className="fixed left-1/2 top-4 z-[95] -translate-x-1/2 rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-black shadow-2xl shadow-yellow-300/30 animate-bounce">🔥 2X BOOST</div>;
}

function ClutchOverlay() {
  return <div className="pointer-events-none fixed inset-0 z-[85] grid place-items-center bg-black/25"><div className="rounded-[34px] border border-yellow-300/40 bg-black/75 px-8 py-6 text-center shadow-2xl backdrop-blur-xl animate-bounce"><div className="text-5xl">⏳</div><div className="mt-2 text-3xl font-black">CLUTCH TIME</div></div></div>;
}

function WinnerReveal({ reveal }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/85 px-6 text-center text-white">
      <div className="rounded-[38px] border border-yellow-300/40 bg-yellow-300/10 p-6 shadow-2xl shadow-yellow-300/20 animate-bounce">
        <div className="text-7xl">🏆</div>
        <p className="mt-3 text-xs font-black uppercase tracking-wide text-yellow-200">{reveal.pot.title} voittaja</p>
        <h2 className="mt-2 text-3xl font-black">Winner Reveal</h2>
        <p className="mt-3 line-clamp-4 text-sm font-bold text-white/70">{reveal.winner.content}</p>
        <p className="mt-4 rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-black text-black">Score {reveal.winner.score}</p>
      </div>
    </div>
  );
}

function PotTabs({ data, activeTab, setActiveTab }) {
  return (
    <section className="mx-auto mt-5 max-w-md rounded-[28px] border border-white/10 bg-white/10 p-2 shadow-xl backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-2">
        {data.map((pot) => (
          <button key={pot.key} onClick={() => setActiveTab(pot.key)} className={`rounded-[22px] px-2 py-3 text-center transition ${activeTab === pot.key ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-black/20 text-white/55"}`}>
            <div className="text-xl">{pot.emoji}</div>
            <div className="mt-1 text-[10px] font-black uppercase">€{pot.amount}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function LiveTicker({ activity }) {
  if (!activity.length) return null;
  return (
    <section className="mx-auto mt-5 max-w-md rounded-[28px] border border-cyan-300/20 bg-cyan-400/10 p-4 shadow-xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase text-cyan-100">Live kilpailu</h2>
        <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
      </div>
      <div className="space-y-2">
        {activity.map((item) => <div key={item.id} className="rounded-2xl bg-black/20 px-3 py-2 text-xs font-black text-white/75">{item.text}</div>)}
      </div>
    </section>
  );
}

function PotCard({ pot, user, boostActive }) {
  const top = pot.leaderboard[0];
  const shell = pot.isNearWin ? "border-yellow-300/70 bg-gradient-to-br from-red-500/25 via-yellow-300/20 to-pink-500/20 animate-pulse" : "border-white/10 bg-white/10";

  return (
    <section className={`overflow-hidden rounded-[38px] border p-[2px] shadow-2xl backdrop-blur-xl ${shell}`}>
      <div className="rounded-[36px] bg-[#111827]/95 p-5">
        {pot.oneLikeToWin && <div className="mb-4 rounded-[24px] bg-green-400 px-4 py-3 text-center text-sm font-black text-black animate-pulse">🚀 YKSI LIKE → VOITTO</div>}
        {pot.isNearWin && <div className="mb-4 rounded-[24px] border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-center text-sm font-black text-yellow-100">LIVE 🔥 ero kärjessä alle 15 pistettä</div>}
        <div className={`rounded-[30px] bg-gradient-to-br ${pot.accent} p-[2px]`}>
          <div className="rounded-[28px] bg-black/75 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-white/60">{pot.emoji} {pot.title}</p>
                <p className="mt-1 text-6xl font-black text-white">€{pot.amount}</p>
                <p className="mt-2 text-xs font-black text-cyan-100">⏳ Umpeutuu: {pot.timeLeft}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 text-center">
                <div className="text-xl font-black text-white">{pot.fillRate}%</div>
                <div className="text-[10px] font-black uppercase text-white/45">täynnä</div>
              </div>
            </div>
            <div className="mt-5 h-4 overflow-hidden rounded-full bg-black/40">
              <div className="h-full rounded-full bg-white" style={{ width: `${pot.fillRate}%` }} />
            </div>
            {boostActive && <p className="mt-4 rounded-2xl bg-yellow-300 px-4 py-3 text-center text-sm font-black text-black">🔥 2X score boost aktiivinen</p>}
          </div>
        </div>

        <MyPosition pot={pot} user={user} />

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
          <div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Pelaajat</div><div className="mt-1 text-xl">{pot.activePlayers}</div></div>
          <div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Postit</div><div className="mt-1 text-xl">{pot.leaderboard.length}</div></div>
          <div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Top</div><div className="mt-1 text-xl">{top?.score || 0}</div></div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-black">Leaderboard</h2>
            {top && <span className="rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-black">TOP: {top.votes} ääntä</span>}
          </div>

          {pot.leaderboard.length ? (
            <div className="space-y-3">
              {pot.leaderboard.map((post, index) => (
                <LeaderRow key={post.id} post={post} index={index} isMe={user?.id === post.user_id} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-center">
              <div className="text-4xl">✨</div>
              <p className="mt-2 text-xl font-black">Ei vielä osallistujia</p>
              <Link to="/new" className="mt-4 block rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black text-white">Luo perustelu</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniPot({ pot, onClick }) {
  return (
    <button onClick={onClick} className={`rounded-[28px] border p-4 text-left shadow-xl backdrop-blur-xl transition active:scale-[0.98] ${pot.isNearWin ? "border-yellow-300/60 bg-yellow-300/10 animate-pulse" : "border-white/10 bg-white/10"}`}>
      <div className="text-2xl">{pot.emoji}</div>
      <div className="mt-2 text-xs font-black uppercase text-white/45">{pot.title}</div>
      <div className="mt-1 text-2xl font-black text-yellow-300">€{pot.amount}</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/35"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${pot.fillRate}%` }} /></div>
    </button>
  );
}

function MyPosition({ pot, user }) {
  if (!user) return <div className="mt-4 rounded-[24px] border border-cyan-300/20 bg-cyan-500/10 p-4 text-sm font-black text-cyan-100">👤 Kirjaudu sisään nähdäksesi oman sijoituksen.</div>;

  if (!pot.myRank) {
    return (
      <div className="mt-4 rounded-[24px] border border-pink-300/20 bg-pink-500/10 p-4">
        <p className="text-sm font-black text-pink-100">🎯 Et ole vielä mukana tässä potissa.</p>
        <Link to="/new" className="mt-3 block rounded-2xl bg-cyan-500 px-4 py-3 text-center text-sm font-black text-white">Luo perustelu</Link>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[24px] border border-cyan-300/25 bg-cyan-500/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Oma sijoitus</p>
          <p className="mt-1 text-3xl font-black">#{pot.myRank}</p>
        </div>
        <div className="rounded-2xl bg-black/25 px-4 py-3 text-right">
          <p className="text-xs font-black text-white/45">Nousu</p>
          <p className="text-lg font-black text-yellow-200">{pot.myRank === 1 ? "Johdat" : `${pot.likesNeeded} ääntä`}</p>
        </div>
      </div>
      {pot.oneLikeToWin && <p className="mt-3 rounded-2xl bg-green-400 px-3 py-2 text-center text-xs font-black text-black animate-pulse">🚀 Yksi like voi nostaa sinut voittoon</p>}
      {pot.overtakes > 0 && <p className="mt-3 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 px-3 py-2 text-xs font-black text-yellow-100">🔥 1 like → ohitat {pot.overtakes} pelaajaa</p>}
    </div>
  );
}

function LeaderRow({ post, index, isMe }) {
  const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

  return (
    <div className={`rounded-[26px] border p-4 transition ${isMe ? "border-cyan-300/60 bg-cyan-500/15" : "border-white/10 bg-black/25"}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-yellow-300 text-lg font-black text-black">{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase text-cyan-200">{isMe ? "Sinä" : "Pelaaja"}</p>
            <p className="text-sm font-black text-white/55">Score {Math.round(post.score)}</p>
          </div>
          <p className="mt-2 line-clamp-3 text-base font-black leading-relaxed text-white/75">{post.content}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-white/55">
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
