import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const POTS = [
  { key: "daily", title: "Päiväpotti", emoji: "☀️", base: 25, multiplier: 0.2, endsIn: "Tänään" },
  { key: "weekly", title: "Viikkopotti", emoji: "📆", base: 150, multiplier: 0.6, endsIn: "Tällä viikolla" },
  { key: "monthly", title: "Kuukausipotti", emoji: "🏆", base: 500, multiplier: 1.4, endsIn: "Tässä kuussa" },
  { key: "final", title: "Finaalipotti", emoji: "💎", base: 2000, multiplier: 3.5, endsIn: "Puolivuosifinaali" },
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

function getTimeLeft(type) {
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

  const ms = Math.max(0, end.getTime() - now.getTime());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (days > 0) return `${days} pv ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min ${seconds} s`;
  return `${minutes} min ${seconds} s`;
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
  };
}

function scorePost(post) {
  return Number(post.votes || 0) * 12 + Number(post.ai_score || 0);
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
  const previousTopRef = useRef({});
  const rewardCooldownRef = useRef({});

  function fireEvent(type, emoji, text) {
    const current = Date.now();
    if (rewardCooldownRef.current[type] && current - rewardCooldownRef.current[type] < 6500) return;
    rewardCooldownRef.current[type] = current;
    setLiveEvent({ id: `${current}-${Math.random()}`, emoji, text });
    setActivity((prev) => [{ id: `${current}-${Math.random()}`, text: `${emoji} ${text}` }, ...prev.slice(0, 4)]);
    navigator.vibrate?.([10, 25, 10]);
    setTimeout(() => setLiveEvent(null), 2200);
  }

  useEffect(() => {
    load();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const channel = supabase
      .channel("dopamine-v3-pots")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fireEvent("post", "📝", "Uusi perustelu mukana kilpailussa");
        load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        fireEvent("vote", "💗", "Uusi ääni muutti kilpailua");
        load();
      })
      .subscribe();

    return () => {
      clearInterval(timer);
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
      const leaderboard = [...normalized]
        .map((post) => ({ ...post, score: scorePost(post) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      const myIndex = user?.id ? leaderboard.findIndex((post) => post.user_id === user.id) : -1;
      const me = myIndex >= 0 ? leaderboard[myIndex] : null;
      const ahead = myIndex > 0 ? leaderboard[myIndex - 1] : null;
      const scoreGap = ahead && me ? Math.max(1, Math.ceil(ahead.score - me.score + 1)) : 0;
      const likesNeeded = scoreGap ? Math.max(1, Math.ceil(scoreGap / 12)) : 0;
      const oneLikeScore = me ? me.score + 12 : 0;
      const overtakes = me ? leaderboard.slice(0, myIndex).filter((post) => oneLikeScore > post.score).length : 0;

      return {
        ...pot,
        amount: Math.round(pot.base + activePlayers * pot.multiplier + leaderboard.length * 2),
        fillRate: Math.min(100, Math.round((activePlayers / 1500) * 100)),
        activePlayers,
        leaderboard,
        myRank: myIndex >= 0 ? myIndex + 1 : null,
        likesNeeded,
        overtakes,
        timeLeft: getTimeLeft(pot.key),
        nearWin: leaderboard.length > 1 && Math.abs(leaderboard[0].score - leaderboard[1].score) < 20,
      };
    });
  }, [posts, votes, user?.id, now]);

  useEffect(() => {
    data.forEach((pot) => {
      const top = pot.leaderboard[0];
      if (top) {
        const oldTop = previousTopRef.current[pot.key];
        if (oldTop && oldTop !== top.id) fireEvent(`leader-${pot.key}`, "🔥", `${pot.title}: johtaja vaihtui`);
        previousTopRef.current[pot.key] = top.id;
      }
      if (pot.nearWin) fireEvent(`near-${pot.key}`, "⚠️", `${pot.title}: tilanne kiristyy`);
      if (pot.overtakes > 0) fireEvent(`overtake-${pot.key}`, "🎯", `${pot.title}: 1 like voi ohittaa ${pot.overtakes} pelaajaa`);
    });
  }, [data]);

  return (
    <div className="min-h-[100dvh] bg-[#050816] px-4 pb-28 pt-5 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_44%,#02030a_100%)]" />
      {liveEvent && <LiveEvent event={liveEvent} />}

      <header className="mx-auto max-w-md">
        <Link to="/feed" className="text-xs font-black uppercase tracking-wide text-cyan-200/80">← Takaisin feediin</Link>
        <h1 className="mt-3 text-5xl font-black tracking-tight">💰 Potit</h1>
        <p className="mt-2 text-sm font-bold leading-relaxed text-white/55">
          Dopamine v3: live eventit, near-win, oma sijoitus ja ohitusennuste.
        </p>
      </header>

      <LiveTicker activity={activity} />

      {error && <div className="mx-auto mt-5 max-w-md rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm font-bold text-red-100">{error}</div>}
      {loading && <div className="mx-auto mt-5 max-w-md rounded-3xl border border-white/10 bg-white/10 p-5 font-black text-white/70">Päivitetään potteja...</div>}

      <main className="mx-auto mt-6 max-w-md space-y-5">
        {data.map((pot) => (
          <PotCard key={pot.key} pot={pot} user={user} />
        ))}
      </main>
    </div>
  );
}

function LiveEvent({ event }) {
  return (
    <div className="fixed left-1/2 top-20 z-[80] w-[calc(100%-32px)] max-w-sm -translate-x-1/2">
      <div className="animate-bounce rounded-[28px] border border-yellow-300/40 bg-yellow-300 px-5 py-4 text-center font-black text-black shadow-2xl shadow-yellow-400/30">
        <div className="text-3xl">{event.emoji}</div>
        <div className="mt-1 text-lg leading-tight">{event.text}</div>
      </div>
    </div>
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

function PotCard({ pot, user }) {
  const top = pot.leaderboard[0];

  return (
    <section className="overflow-hidden rounded-[34px] border border-white/10 bg-white/10 p-[2px] shadow-2xl backdrop-blur-xl">
      <div className="rounded-[32px] bg-[#111827]/95 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-white/50">{pot.emoji} {pot.title}</p>
            <p className="mt-1 text-5xl font-black text-yellow-300">€{pot.amount}</p>
            <p className="mt-2 text-xs font-black text-cyan-200">⏳ Umpeutuu: {pot.timeLeft}</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-3 text-center">
            <div className="text-xl font-black text-cyan-100">{pot.fillRate}%</div>
            <div className="text-[10px] font-black uppercase text-white/45">täynnä</div>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/35">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-yellow-300 to-pink-400" style={{ width: `${pot.fillRate}%` }} />
        </div>

        {pot.nearWin && <div className="mt-4 rounded-[22px] border border-red-400/30 bg-red-500/15 p-4 text-sm font-black text-red-50">⚠️ Tilanne kiristyy — voitto voi vaihtua milloin tahansa</div>}

        <MyPosition pot={pot} user={user} />

        <div className="mt-4 rounded-[24px] border border-yellow-300/20 bg-yellow-300/10 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-yellow-200">Tilanne nyt</p>
          <p className="mt-1 text-sm font-bold leading-relaxed text-white/70">{pot.endsIn} · {pot.activePlayers} aktiivista pelaajaa</p>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Leaderboard</h2>
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
      <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Oma sijoitus</p>
      <p className="mt-1 text-3xl font-black">#{pot.myRank}</p>
      <p className="mt-2 text-sm font-black text-white/85">
        {pot.myRank === 1 ? "Johdat tätä pottia juuri nyt." : `${pot.likesNeeded} ääntä → nousu seuraavalle sijalle.`}
      </p>
      {pot.overtakes > 0 && <p className="mt-2 rounded-2xl border border-yellow-300/25 bg-yellow-300/10 px-3 py-2 text-xs font-black text-yellow-100">🔥 1 like → ohitat {pot.overtakes} pelaajaa</p>}
    </div>
  );
}

function LeaderRow({ post, index, isMe }) {
  const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

  return (
    <div className={`rounded-[24px] border p-4 ${isMe ? "border-cyan-300/50 bg-cyan-500/15" : "border-white/10 bg-black/25"}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-yellow-300 text-sm font-black text-black">{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase text-cyan-200">{isMe ? "Sinä" : "Pelaaja"}</p>
            <p className="text-xs font-black text-white/45">Score {Math.round(post.score)}</p>
          </div>
          <p className="mt-2 line-clamp-3 text-sm font-bold leading-relaxed text-white/75">{post.content}</p>
          <div className="mt-3 flex items-center gap-2 text-xs font-black text-white/55">
            <span>💗 {post.votes}</span>
            <span>•</span>
            <span>🤖 {Math.round(post.ai_score)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
