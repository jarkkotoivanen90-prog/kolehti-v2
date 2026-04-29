import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function scorePost(post) {
  const votes = Number(post.votes || post.vote_count || 0);
  const ai = Number(post.ai_score || post.growth_score || 50);
  const growth = Number(post.growth_score || 0);
  const boost = Number(post.boost_score || 0);
  const watch = Number(post.watch_time_total || 0);
  const shares = Number(post.shares || post.share_count || 0);
  const viral = 1 + Math.min(0.7, shares * 0.04 + watch * 0.01);
  return Math.round((votes * 12 + ai + growth * 0.6 + boost * 2 + watch * 2) * viral);
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
    group_id: post.group_id || "yleinen",
    votes: Number(voteCount || post.vote_count || post.votes || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || 0),
    boost_score: Number(post.boost_score || 0),
    watch_time_total: Number(post.watch_time_total || 0),
    shares: Number(post.shares || post.share_count || 0),
    created_at: post.created_at || new Date().toISOString(),
  };
}

function rankIcon(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function LeaderboardWarPage() {
  const [posts, setPosts] = useState([]);
  const [dailyPosts, setDailyPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [climb, setClimb] = useState(null);
  const previousRanksRef = useRef({});
  const dailySavedRef = useRef(false);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("leaderboard-war-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        flash("🔥 War ranking muuttui");
        load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        flash("💗 Uusi ääni muutti sotaa");
        load();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!posts.length) return;
    detectClimb(posts);
  }, [posts]);

  useEffect(() => {
    if (!dailyPosts.length || dailySavedRef.current) return;
    dailySavedRef.current = true;
    saveDailyWinner(dailyPosts[0]);
  }, [dailyPosts]);

  async function load() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;
      setUser(currentUser);

      const [{ data: postData, error: postError }, { data: voteData, error: voteError }] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("votes").select("post_id,user_id,value,created_at").limit(10000),
      ]);

      if (postError || voteError) throw postError || voteError;

      const voteMap = {};
      (voteData || []).forEach((vote) => {
        if (!vote?.post_id) return;
        voteMap[vote.post_id] = (voteMap[vote.post_id] || 0) + Number(vote.value || 1);
      });

      const ranked = (postData || [])
        .map((post) => normalizePost(post, voteMap[post.id] || 0))
        .filter(Boolean)
        .map((post) => ({ ...post, score: scorePost({ ...post, votes: voteMap[post.id] || post.votes || 0 }) }))
        .sort((a, b) => b.score - a.score);

      const daily = ranked.filter((post) => new Date(post.created_at).getTime() >= new Date(dayStartIso()).getTime());

      setPosts(ranked);
      setDailyPosts(daily.length ? daily : ranked);
    } catch (error) {
      console.warn("Leaderboard war load failed", error);
      flash("⚠️ Leaderboardin lataus epäonnistui");
    } finally {
      setLoading(false);
    }
  }

  function detectClimb(rankedPosts) {
    const nextRanks = {};
    let bestMove = null;

    rankedPosts.slice(0, 50).forEach((post, index) => {
      const previous = previousRanksRef.current[post.id];
      const current = index + 1;
      nextRanks[post.id] = current;
      if (previous && previous > current) {
        const delta = previous - current;
        if (!bestMove || delta > bestMove.delta) {
          bestMove = { post, from: previous, to: current, delta };
        }
      }
    });

    previousRanksRef.current = nextRanks;

    if (bestMove) {
      setClimb({ id: `${Date.now()}-${Math.random()}`, ...bestMove });
      flash(`🚀 Nousu! #${bestMove.from} → #${bestMove.to}`);
      setTimeout(() => setClimb(null), 2400);
    }
  }

  async function saveDailyWinner(winner) {
    if (!winner?.id) return;
    const key = `daily_winner_${todayKey()}`;
    try {
      const already = localStorage.getItem(key);
      if (already === winner.id) return;
      localStorage.setItem(key, winner.id);

      await supabase.from("daily_winners").upsert({
        day: todayKey(),
        post_id: winner.id,
        user_id: winner.user_id,
        score: winner.score,
        votes: winner.votes,
        watch_time_total: winner.watch_time_total,
        shares: winner.shares,
      }, { onConflict: "day" });
    } catch (error) {
      console.warn("daily winner save skipped", error);
    }
  }

  function flash(text) {
    setEvent({ id: `${Date.now()}-${Math.random()}`, text });
    navigator.vibrate?.([8, 18, 8]);
    setTimeout(() => setEvent(null), 1800);
  }

  const top10 = posts.slice(0, 10);
  const dailyWinner = dailyPosts[0] || posts[0] || null;
  const myIndex = user?.id ? posts.findIndex((post) => post.user_id === user.id) : -1;
  const myPost = myIndex >= 0 ? posts[myIndex] : null;
  const next = myIndex > 0 ? posts[myIndex - 1] : null;
  const gap = next && myPost ? Math.max(0, next.score - myPost.score + 1) : 0;
  const groups = useMemo(() => {
    const map = new Map();
    posts.forEach((post) => {
      const key = post.group_id || "yleinen";
      const current = map.get(key) || { id: key, score: 0, posts: 0 };
      current.score += Number(post.score || 0);
      current.posts += 1;
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [posts]);

  return (
    <div className="min-h-[100dvh] bg-[#050816] px-4 pb-32 pt-6 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#7c2d12_0%,#050816_42%,#02030a_100%)]" />
      {event && <div className="fixed left-1/2 top-20 z-[90] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-[26px] border border-yellow-300/30 bg-black/75 px-5 py-4 text-center text-sm font-black shadow-2xl backdrop-blur-xl">{event.text}</div>}
      {climb && <ClimbAnimation climb={climb} />}

      <header className="mx-auto max-w-md">
        <div className="flex items-center justify-between gap-3">
          <Link to="/feed" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white/70">← Feed</Link>
          <Link to="/pots" className="rounded-2xl bg-yellow-300 px-4 py-3 text-xs font-black text-black">Potit</Link>
        </div>
        <h1 className="mt-5 text-5xl font-black tracking-tight">🏆 Leaderboard War</h1>
        <p className="mt-2 text-sm font-bold leading-relaxed text-white/55">Daily winner automaatio ja climb animation mukana.</p>
      </header>

      <main className="mx-auto mt-6 max-w-md space-y-5">
        <DailyWinnerCard winner={dailyWinner} />

        <section className="rounded-[34px] border border-yellow-300/20 bg-yellow-300/10 p-5 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-wide text-yellow-200">🔥 War status</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">Postit</div><div className="mt-1 text-2xl">{posts.length}</div></div>
            <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">Top score</div><div className="mt-1 text-2xl text-yellow-200">{posts[0]?.score || 0}</div></div>
            <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">Live</div><div className="mt-1 text-2xl text-green-300">ON</div></div>
          </div>
        </section>

        {loading && <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 text-center font-black text-white/70">War latautuu...</div>}

        <section className="space-y-3">
          <h2 className="text-xl font-black">Top 10</h2>
          {top10.map((post, index) => (
            <WarRow key={post.id} post={post} index={index} isMe={post.user_id === user?.id} climbId={climb?.post?.id} />
          ))}
        </section>

        <section className="rounded-[34px] border border-cyan-300/20 bg-cyan-500/10 p-5 shadow-2xl">
          <h2 className="text-xl font-black">👥 Porukka vs porukka</h2>
          <div className="mt-4 space-y-3">
            {groups.map((group, index) => (
              <div key={group.id} className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3 text-sm font-black">
                  <span>{rankIcon(index)} Porukka {String(group.id).slice(0, 8)}</span>
                  <span className="text-cyan-200">{Math.round(group.score)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, group.score / Math.max(1, groups[0]?.score || 1) * 100)}%` }} />
                </div>
                <p className="mt-2 text-xs font-bold text-white/45">{group.posts} postausta</p>
              </div>
            ))}
            {!groups.length && <p className="text-sm font-bold text-white/50">Ei porukkadataa vielä.</p>}
          </div>
        </section>
      </main>

      {myPost && (
        <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[28px] border border-yellow-300/30 bg-yellow-300 p-4 text-black shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide opacity-60">Sinun sijoitus</p>
              <p className="text-2xl font-black">#{myIndex + 1}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase opacity-60">Score</p>
              <p className="text-2xl font-black">{myPost.score}</p>
            </div>
          </div>
          {next ? <p className="mt-2 text-sm font-black">🔥 {gap} pistettä seuraavaan sijaan</p> : <p className="mt-2 text-sm font-black">👑 Johdat waria juuri nyt</p>}
        </div>
      )}
    </div>
  );
}

function DailyWinnerCard({ winner }) {
  if (!winner) return null;
  return (
    <section className="overflow-hidden rounded-[34px] border border-yellow-300/40 bg-gradient-to-br from-yellow-300/20 via-black/25 to-orange-500/15 p-[2px] shadow-2xl">
      <div className="rounded-[32px] bg-[#111827]/90 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-yellow-200">🏆 Päivän winner automaatio</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">Daily Winner</h2>
        <p className="mt-3 line-clamp-3 text-sm font-bold leading-relaxed text-white/70">{winner.content}</p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-black">
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">Score</div><div className="mt-1 text-xl text-yellow-200">{winner.score}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">Äänet</div><div className="mt-1 text-xl">{winner.votes}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">Katselut</div><div className="mt-1 text-xl">{winner.watch_time_total}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">Jaot</div><div className="mt-1 text-xl">{winner.shares}</div></div>
        </div>
      </div>
    </section>
  );
}

function ClimbAnimation({ climb }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[35%] z-[95] mx-auto max-w-sm px-6 text-center">
      <div className="animate-bounce rounded-[34px] border border-green-300/40 bg-green-400 px-6 py-5 text-black shadow-2xl shadow-green-400/30">
        <div className="text-5xl">🚀</div>
        <div className="mt-2 text-2xl font-black">CLIMB!</div>
        <div className="mt-1 text-sm font-black">#{climb.from} → #{climb.to}</div>
        <div className="mt-2 line-clamp-2 text-xs font-bold opacity-70">{climb.post?.content}</div>
      </div>
    </div>
  );
}

function WarRow({ post, index, isMe, climbId }) {
  const climbed = climbId === post.id;
  return (
    <article className={`rounded-[28px] border p-4 shadow-xl transition-all duration-500 ${climbed ? "scale-[1.03] border-green-300/70 bg-green-400/20" : isMe ? "border-yellow-300/60 bg-yellow-300 text-black" : "border-white/10 bg-white/10 text-white"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-black ${isMe ? "bg-black text-yellow-300" : "bg-yellow-300 text-black"}`}>{rankIcon(index)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase opacity-60">{isMe ? "Sinä" : climbed ? "Nousussa" : "Pelaaja"}</p>
            <p className="text-lg font-black">{post.score}</p>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-bold opacity-80">{post.content}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black opacity-70">
            <span>💗 {post.votes}</span>
            <span>👀 {post.watch_time_total}</span>
            <span>🚀 {post.shares}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
