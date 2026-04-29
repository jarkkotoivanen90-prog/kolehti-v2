import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function mediaUrlFor(post) {
  return post?.media_url || post?.video_url || post?.image_url || post?.photo_url || "";
}

function mediaTypeFor(post) {
  const url = mediaUrlFor(post);
  if (!url) return null;
  if (post?.media_type === "video" || post?.video_url || /\.(mp4|webm|mov)(\?|$)/i.test(url)) return "video";
  return "image";
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
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
    watch_time_total: Number(post.watch_time_total || 0),
    shares: Number(post.shares || post.share_count || 0),
    media_url: mediaUrlFor(post) || null,
    media_type: mediaTypeFor(post),
  };
}

function scorePost(post) {
  const viralMultiplier = 1 + Math.min(0.7, Number(post.shares || 0) * 0.04 + Number(post.watch_time_total || 0) * 0.01);
  const base = Number(post.votes || 0) * 12 + Number(post.ai_score || 0) + Number(post.growth_score || 0) * 0.6 + Number(post.boost_score || 0) * 2 + Number(post.watch_time_total || 0) * 2;
  return Math.round(base * viralMultiplier);
}

function rankBadge(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

function getStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const saved = JSON.parse(localStorage.getItem("kolehti_media_streak") || "{}");
    if (saved.date === today) return Number(saved.count || 1);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const next = saved.date === yesterday ? Number(saved.count || 0) + 1 : 1;
    localStorage.setItem("kolehti_media_streak", JSON.stringify({ date: today, count: next }));
    return next;
  } catch {
    return 1;
  }
}

export default function FeedPageMedia() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);
  const [voted, setVoted] = useState({});
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [streak, setStreak] = useState(1);
  const [hiddenChrome, setHiddenChrome] = useState(false);
  const scrollerRef = useRef(null);
  const watchRef = useRef({});
  const eventAtRef = useRef(0);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    setStreak(getStreak());
    loadFeed();
    const channel = supabase
      .channel("media-feed-next-level")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        pushEvent("📝 Uusi postaus feedissä", true);
        loadFeed();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        pushEvent("💗 Uusi ääni muutti rankingia", true);
        loadFeed();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const cards = Array.from(el.querySelectorAll("[data-feed-card]"));
        const middle = el.scrollTop + el.clientHeight / 2;
        let next = 0;
        let best = Infinity;
        cards.forEach((card, index) => {
          const distance = Math.abs(card.offsetTop + card.offsetHeight / 2 - middle);
          if (distance < best) {
            best = distance;
            next = index;
          }
        });
        const delta = el.scrollTop - lastScrollRef.current;
        if (delta > 14) setHiddenChrome(true);
        if (delta < -14 || el.scrollTop < 20) setHiddenChrome(false);
        lastScrollRef.current = el.scrollTop;
        setActiveIndex(next);
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [posts.length]);

  async function loadFeed() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;
      setUser(currentUser);

      const [{ data: postData, error: postError }, { data: voteData, error: voteError }] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(120),
        supabase.from("votes").select("post_id,user_id,value,created_at").limit(5000),
      ]);

      if (postError || voteError) throw postError || voteError;

      const voteMap = {};
      const votedMap = {};
      (voteData || []).forEach((vote) => {
        if (!vote?.post_id) return;
        voteMap[vote.post_id] = (voteMap[vote.post_id] || 0) + Number(vote.value || 1);
        if (vote.user_id === currentUser?.id) votedMap[vote.post_id] = true;
      });

      const prepared = (postData || [])
        .map((post) => normalizePost(post, voteMap[post.id] || 0))
        .filter(Boolean)
        .map((post) => ({ ...post, score: scorePost(post) }))
        .sort((a, b) => b.score - a.score);

      setPosts(prepared);
      setVotes(voteData || []);
      setVoted(votedMap);
    } catch (error) {
      console.warn("media feed load failed", error);
      pushEvent("⚠️ Feedin lataus epäonnistui", true);
    } finally {
      setLoading(false);
    }
  }

  function pushEvent(text, force = false) {
    const now = Date.now();
    if (!force && now - eventAtRef.current < 3500) return;
    eventAtRef.current = now;
    setEvent({ id: `${now}-${Math.random()}`, text });
    setActivity((prev) => [{ id: `${now}-${Math.random()}`, text }, ...prev.slice(0, 4)]);
    navigator.vibrate?.([8, 18, 8]);
    setTimeout(() => setEvent(null), 1800);
  }

  function startWatch(post) {
    if (!post?.id) return;
    if (!watchRef.current[post.id]) watchRef.current[post.id] = { started: Date.now(), rewarded: false };
  }

  async function rewardWatch(post) {
    if (!post?.id) return;
    const state = watchRef.current[post.id] || { rewarded: false };
    if (state.rewarded) return;
    watchRef.current[post.id] = { ...state, rewarded: true };
    pushEvent(`👀 +2 XP · streak ${streak}x · potti kasvaa`, true);

    const nextCount = Number(post.watch_time_total || 0) + 1;
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, watch_time_total: nextCount, score: scorePost({ ...p, watch_time_total: nextCount }) } : p).sort((a, b) => b.score - a.score));

    try {
      const { error } = await supabase.from("posts").update({ watch_time_total: nextCount }).eq("id", post.id);
      if (error) console.warn("watch_time_total update skipped", error.message);
    } catch (error) {
      console.warn("watch XP fallback", error);
    }
  }

  function handleVideoTime(event, post) {
    startWatch(post);
    if (Number(event?.target?.currentTime || 0) >= 3) rewardWatch(post);
  }

  async function vote(post) {
    if (!user) {
      pushEvent("Kirjaudu ensin sisään", true);
      return;
    }
    if (voted[post.id]) {
      pushEvent("Olet jo äänestänyt tämän", true);
      return;
    }

    const { error } = await supabase.from("votes").insert({ post_id: post.id, user_id: user.id, value: 1 });
    if (error) {
      pushEvent(error.message || "Äänestys epäonnistui", true);
      return;
    }

    setVoted((prev) => ({ ...prev, [post.id]: true }));
    pushEvent("💗 +XP · ääni annettu", true);
    await loadFeed();
  }

  async function sharePost(post) {
    const url = `${window.location.origin}/feed?post=${post.id}&ref=${user?.id || "share"}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "KOLEHTI", text: post.content, url });
      } else {
        await navigator.clipboard?.writeText(url);
      }
      pushEvent("🚀 Jaettu · viral multiplier kasvaa", true);
      const nextShares = Number(post.shares || 0) + 1;
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, shares: nextShares, score: scorePost({ ...p, shares: nextShares }) } : p).sort((a, b) => b.score - a.score));
      try {
        await supabase.from("posts").update({ shares: nextShares, boost_score: Number(post.boost_score || 0) + 5 }).eq("id", post.id);
      } catch (error) {
        console.warn("share update skipped", error);
      }
    } catch {
      pushEvent("Jakoa ei tehty", true);
    }
  }

  const activePlayers = useMemo(() => {
    const ids = new Set();
    posts.forEach((post) => post.user_id && ids.add(post.user_id));
    votes.forEach((vote) => vote.user_id && ids.add(vote.user_id));
    return Math.max(1, ids.size);
  }, [posts, votes]);

  const watchPot = Math.round(25 + activePlayers * 0.25 + posts.reduce((sum, post) => sum + Number(post.watch_time_total || 0), 0) * 0.15);
  const topPost = posts[0];

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_45%,#02030a_100%)]" />

      {event && (
        <div className="fixed left-1/2 top-24 z-[80] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-[26px] border border-cyan-300/30 bg-black/70 px-5 py-4 text-center text-sm font-black text-white shadow-2xl backdrop-blur-xl">
          {event.text}
        </div>
      )}

      <header className={`fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#050816]/90 px-4 py-4 backdrop-blur-xl transition-transform duration-300 ${hiddenChrome ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black tracking-tight">KOLEHTI</h1>
            <p className="text-[10px] font-black uppercase tracking-wide text-white/45">next level · snap media feed</p>
          </div>
          <Link to="/new" className="rounded-[22px] bg-cyan-500 px-5 py-4 text-sm font-black shadow-2xl shadow-cyan-500/25">Uusi</Link>
        </div>
      </header>

      <div className={`fixed bottom-4 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[28px] border border-yellow-300/20 bg-black/65 p-3 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${hiddenChrome ? "translate-y-32" : "translate-y-0"}`}>
        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black">
          <div className="rounded-2xl bg-yellow-300/15 p-2"><div className="text-white/45">Potti</div><div className="text-yellow-200">€{watchPot}</div></div>
          <div className="rounded-2xl bg-cyan-300/10 p-2"><div className="text-white/45">Streak</div><div className="text-cyan-200">{streak}x</div></div>
          <div className="rounded-2xl bg-pink-300/10 p-2"><div className="text-white/45">Sija</div><div className="text-pink-200">#{activeIndex}</div></div>
          <Link to="/pots" className="rounded-2xl bg-white/10 p-2"><div className="text-white/45">Potit</div><div>🏆</div></Link>
        </div>
      </div>

      <main ref={scrollerRef} className="h-[100dvh] snap-y snap-mandatory overflow-y-auto scroll-smooth px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section data-feed-card className="mx-auto flex min-h-[100dvh] max-w-md snap-start items-center pt-24">
          <div className="w-full rounded-[38px] border border-yellow-300/20 bg-yellow-300/10 p-6 shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-wide text-yellow-200">🔥 Next level feed</p>
            <h2 className="mt-2 text-5xl font-black leading-none">€{watchPot}</h2>
            <p className="mt-3 text-sm font-bold text-white/60">Katselut, jaot ja äänet kasvattavat porukan yhteistä painetta.</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black">
              <div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Pelaajat</div><div className="mt-1 text-xl">{activePlayers}</div></div>
              <div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Postit</div><div className="mt-1 text-xl">{posts.length}</div></div>
              <div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Top</div><div className="mt-1 text-xl">{topPost ? Math.round(topPost.score) : 0}</div></div>
            </div>
            <p className="mt-5 rounded-2xl bg-black/25 p-4 text-sm font-black text-cyan-100">Swipe alas → jokainen kortti on oma kilpailu.</p>
          </div>
        </section>

        {loading && <section data-feed-card className="mx-auto flex min-h-[100dvh] max-w-md snap-start items-center"><div className="w-full rounded-[34px] border border-white/10 bg-white/10 p-8 text-center font-black">Feed latautuu...</div></section>}

        {!loading && posts.length === 0 && (
          <section data-feed-card className="mx-auto flex min-h-[100dvh] max-w-md snap-start items-center">
            <div className="w-full rounded-[34px] border border-white/10 bg-white/10 p-8 text-center shadow-2xl">
              <div className="text-5xl">✨</div>
              <h2 className="mt-3 text-3xl font-black">Ei vielä postauksia</h2>
              <Link to="/new" className="mt-5 block rounded-[24px] bg-cyan-500 px-5 py-4 text-sm font-black">Luo postaus</Link>
            </div>
          </section>
        )}

        {!loading && posts.map((post, index) => (
          <section key={post.id} data-feed-card className="mx-auto flex min-h-[100dvh] max-w-md snap-start items-center py-6">
            <PostCard post={post} index={index} voted={Boolean(voted[post.id])} onVote={vote} onShare={sharePost} onImageWatch={rewardWatch} onImageStart={startWatch} onVideoTime={handleVideoTime} active={activeIndex === index + 1} />
          </section>
        ))}
      </main>
    </div>
  );
}

function PostCard({ post, index, voted, onVote, onShare, onImageStart, onImageWatch, onVideoTime, active }) {
  const mediaUrl = mediaUrlFor(post);
  const mediaType = mediaTypeFor(post);
  const viralMultiplier = (1 + Math.min(0.7, Number(post.shares || 0) * 0.04 + Number(post.watch_time_total || 0) * 0.01)).toFixed(2);

  return (
    <article className={`relative w-full overflow-hidden rounded-[38px] border p-[2px] shadow-2xl transition-all duration-300 ${active ? "scale-100 opacity-100" : "scale-[0.97] opacity-80"} ${index === 0 ? "border-yellow-300/60 bg-gradient-to-br from-yellow-300 via-pink-500 to-cyan-300" : "border-cyan-300/20 bg-white/10"}`}>
      <div className="rounded-[36px] bg-[#111827]/95 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-yellow-300 text-xl font-black text-black">{rankBadge(index)}</div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-xs font-black uppercase text-cyan-200">{mediaUrl ? mediaType === "video" ? "🎥 Video" : "🖼️ Kuva" : "💬 Teksti"}</p>
            <p className="mt-1 text-xs font-black text-white/45">Score {Math.round(post.score || 0)} · Viral {viralMultiplier}x</p>
          </div>
        </div>

        <p className="mt-5 whitespace-pre-wrap break-words text-2xl font-black leading-relaxed text-white/90">{post.content}</p>

        {mediaUrl && (
          <div className="mt-5 overflow-hidden rounded-[30px] border border-white/10 bg-black/30">
            {mediaType === "video" ? (
              <video src={mediaUrl} className="max-h-[58dvh] w-full object-cover" autoPlay muted loop playsInline controls={false} onPlay={() => onImageStart(post)} onTimeUpdate={(event) => onVideoTime(event, post)} />
            ) : (
              <img src={mediaUrl} alt="Post media" className="max-h-[58dvh] w-full object-cover" onLoad={() => { onImageStart(post); setTimeout(() => onImageWatch(post), 3000); }} onTouchStart={() => { onImageStart(post); setTimeout(() => onImageWatch(post), 3000); }} />
            )}
            <div className="border-t border-white/10 px-4 py-3 text-xs font-black text-pink-100">👀 3s katselu → +XP · kasvattaa pottia</div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-4 gap-2 text-center text-[10px] font-black">
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">ÄÄNET</div><div className="mt-1 text-xl">{post.votes}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">KATSELUT</div><div className="mt-1 text-xl text-pink-300">{post.watch_time_total || 0}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">JAOT</div><div className="mt-1 text-xl text-cyan-200">{post.shares || 0}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">SIJA</div><div className="mt-1 text-xl">#{index + 1}</div></div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onVote(post)} disabled={voted} className="rounded-[24px] bg-cyan-500 px-4 py-4 text-base font-black text-white shadow-2xl shadow-cyan-500/25 transition active:scale-[0.98] disabled:bg-white/10 disabled:text-white/40">{voted ? "Äänestetty" : "Tykkää +XP"}</button>
          <button type="button" onClick={() => onShare(post)} className="rounded-[24px] bg-pink-500 px-4 py-4 text-base font-black text-white shadow-2xl shadow-pink-500/25 transition active:scale-[0.98]">Jaa +Boost</button>
        </div>
      </div>
    </article>
  );
}
