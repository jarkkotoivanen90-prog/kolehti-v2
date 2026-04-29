import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const FINLAND_PHOTOS = {
  hero: "https://commons.wikimedia.org/wiki/Special:FilePath/Helsinki_skyline_(Sep_2024_-_01).jpg",
  lake: "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_Lake.jpg",
  road: "https://commons.wikimedia.org/wiki/Special:FilePath/Road_in_Finland.jpg",
  aurora: "https://commons.wikimedia.org/wiki/Special:FilePath/Aurora_borealis_(21868630118).jpg",
  forest: "https://commons.wikimedia.org/wiki/Special:FilePath/Forest_in_Finland.jpg",
  archipelago: "https://commons.wikimedia.org/wiki/Special:FilePath/On_an_island_in_the_Finnish_archipelago.jpg",
};

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

function personalizedScorePost(post, userId, votedMap = {}) {
  const base = scorePost(post);
  const ownPenalty = userId && post.user_id === userId ? -50 : 0;
  const votedPenalty = votedMap?.[post.id] ? -30 : 0;
  return Math.max(0, base + ownPenalty + votedPenalty);
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

function InsanityStyles() {
  return (
    <style>{`
      @keyframes neonPulse{0%,100%{filter:drop-shadow(0 0 12px rgba(34,211,238,.38));transform:scale(1)}50%{filter:drop-shadow(0 0 28px rgba(34,211,238,.92)) drop-shadow(0 0 18px rgba(250,204,21,.45));transform:scale(1.035)}}
      @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
      @keyframes sweep{0%{transform:translateX(-150%) skewX(-18deg);opacity:0}25%{opacity:.68}55%{transform:translateX(150%) skewX(-18deg);opacity:0}100%{transform:translateX(150%) skewX(-18deg);opacity:0}}
      @keyframes potGlow{0%,100%{box-shadow:0 0 22px rgba(250,204,21,.32),0 0 44px rgba(34,211,238,.12)}50%{box-shadow:0 0 38px rgba(250,204,21,.78),0 0 76px rgba(34,211,238,.26)}}
      @keyframes alive{0%,100%{opacity:.76;transform:scale(1)}50%{opacity:1;transform:scale(1.09)}}
      @keyframes dominantPlus{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.06)}}
      @keyframes photoFade{0%{opacity:0;transform:scale(1.045)}100%{opacity:1;transform:scale(1)}}
      .neon-pulse{animation:neonPulse 3.1s ease-in-out infinite}.floaty{animation:floaty 3.2s ease-in-out infinite}.pot-glow{animation:potGlow 2.35s ease-in-out infinite}.alive{animation:alive 2.4s ease-in-out infinite}.dominant-plus{animation:dominantPlus 2.2s ease-in-out infinite}.photo-in{animation:photoFade 1s ease both}.sweep{position:relative;overflow:hidden}.sweep:after{content:"";position:absolute;inset:-40px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.26),transparent);animation:sweep 5.4s ease-in-out infinite;pointer-events:none}.safe-text{min-width:0;overflow:hidden;text-overflow:ellipsis}.snap-card{scroll-snap-align:start;scroll-snap-stop:always}
    `}</style>
  );
}

function BgPhoto({ src, alt = "", className = "", style }) {
  return <img src={src} alt={alt} className={`photo-in pointer-events-none absolute inset-0 h-full w-full object-cover ${className}`} style={style} loading="eager" decoding="async" />;
}

function Tap({ to, children, className = "", onPulse }) {
  return (
    <Link to={to} onClick={() => { navigator.vibrate?.(8); onPulse?.(); }} className={className}>
      {children}
    </Link>
  );
}

function BottomNav({ onPulse }) {
  const location = useLocation();
  const items = [
    { to: "/", icon: "⌂", label: "Koti", alive: true },
    { to: "/feed", icon: "🔥", label: "Feed", badge: "LIVE" },
    { to: "/new", icon: "+", label: "Uusi", fab: true },
    { to: "/pots", icon: "🏆", label: "Potit", badge: "HOT", gold: true },
    { to: "/profile", icon: "●", label: "Profiili", alive: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-md px-5 pb-4 text-white">
      <div className="relative rounded-[40px] border border-cyan-300/25 bg-[#061126]/95 px-4 pb-5 pt-4 shadow-2xl shadow-cyan-500/20 backdrop-blur-2xl">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <div className="grid grid-cols-5 items-end text-center text-[12px] font-black">
          {items.map((item) => {
            const active = location.pathname === item.to;
            if (item.fab) {
              return (
                <Tap onPulse={onPulse} key={item.to} to={item.to} className="-mt-14 flex flex-col items-center">
                  <div className="dominant-plus grid h-[96px] w-[96px] place-items-center rounded-full border-[7px] border-[#061126] bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-700 text-[68px] font-black leading-none shadow-2xl shadow-cyan-400/55">+</div>
                  <div className="mt-1 text-white">{item.label}</div>
                </Tap>
              );
            }
            return (
              <Tap onPulse={onPulse} key={item.to} to={item.to} className={`relative flex flex-col items-center gap-2 rounded-3xl px-1 py-2 active:scale-95 ${active ? "text-cyan-200" : "text-white/55"}`}>
                {item.badge && <span className={`absolute -top-2 rounded-full px-2 py-0.5 text-[8px] font-black ${item.gold ? "bg-yellow-300 text-black" : "bg-pink-500 text-white"}`}>{item.badge}</span>}
                <div className={`grid h-12 w-12 place-items-center rounded-3xl text-2xl ${active ? "bg-cyan-400/15 shadow-lg shadow-cyan-400/25" : item.gold ? "bg-yellow-300/10" : "bg-white/5"} ${item.alive ? "alive" : ""}`}>{item.icon}</div>
                <div>{item.label}</div>
              </Tap>
            );
          })}
        </div>
      </div>
    </nav>
  );
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
  const [parallaxY, setParallaxY] = useState(0);
  const scrollerRef = useRef(null);
  const watchRef = useRef({});
  const eventAtRef = useRef(0);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    setStreak(getStreak());
    loadFeed();
    const channel = supabase
      .channel("media-feed-insanity-finland")
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
        setParallaxY(Math.min(260, el.scrollTop || 0));
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
        .map((post) => ({ ...post, score: personalizedScorePost(post, currentUser?.id, votedMap), rawScore: scorePost(post) }))
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
  const totalWatches = posts.reduce((sum, post) => sum + Number(post.watch_time_total || 0), 0);

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <InsanityStyles />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_45%,#02030a_100%)]" />
      <BgPhoto src={FINLAND_PHOTOS.forest} alt="Suomalainen metsä" className="fixed opacity-20 blur-[1px]" style={{ transform: `translateY(${parallaxY * -0.04}px) scale(1.08)` }} />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#050816]/70 via-[#050816]/88 to-[#02030a]" />

      {event && (
        <div className="fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-[26px] border border-cyan-300/30 bg-black/75 px-5 py-4 text-center text-sm font-black text-white shadow-2xl shadow-cyan-400/20 backdrop-blur-xl">
          {event.text}
        </div>
      )}

      <header className={`fixed left-0 right-0 top-0 z-50 px-4 pt-4 transition-transform duration-300 ${hiddenChrome ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="sweep mx-auto max-w-md overflow-hidden rounded-[34px] border border-cyan-300/25 bg-[#061126]/88 p-4 shadow-2xl shadow-cyan-500/15 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="neon-pulse grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-200 to-blue-700 text-xl shadow-xl shadow-cyan-400/30">K</span>
                <div className="min-w-0">
                  <h1 className="safe-text text-[34px] font-black leading-none tracking-tight">KOLEHTI</h1>
                  <p className="safe-text text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">insanity media feed</p>
                </div>
              </div>
            </div>
            <Link to="/new" className="shrink-0 rounded-[22px] bg-gradient-to-r from-cyan-300 to-blue-600 px-5 py-4 text-sm font-black shadow-2xl shadow-cyan-500/30">Uusi</Link>
          </div>
        </div>
      </header>

      <main ref={scrollerRef} className="h-[100dvh] snap-y snap-mandatory overflow-y-auto scroll-smooth px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section data-feed-card className="snap-card mx-auto flex min-h-[100dvh] max-w-md items-center pt-24">
          <div className="relative w-full overflow-hidden rounded-[40px] border border-yellow-300/25 p-[2px] shadow-2xl shadow-yellow-300/10">
            <BgPhoto src={FINLAND_PHOTOS.archipelago} alt="Suomen saaristo" className="opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/24 via-slate-950/62 to-slate-950/95" />
            <div className="relative rounded-[38px] p-6">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-yellow-200">🔥 Suomen kuumin feed</p>
              <h2 className="mt-3 text-[58px] font-black leading-none tracking-tight">€{watchPot}</h2>
              <p className="mt-3 text-sm font-bold leading-snug text-white/72">Katselut, jaot ja äänet kasvattavat porukan yhteistä painetta. Swipe alas ja nosta suosikki kärkeen.</p>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black">
                <div className="rounded-2xl bg-black/35 p-3 backdrop-blur-md"><div className="text-white/45">Pelaajat</div><div className="mt-1 text-xl">{activePlayers}</div></div>
                <div className="rounded-2xl bg-black/35 p-3 backdrop-blur-md"><div className="text-white/45">Postit</div><div className="mt-1 text-xl">{posts.length}</div></div>
                <div className="rounded-2xl bg-black/35 p-3 backdrop-blur-md"><div className="text-white/45">Katselut</div><div className="mt-1 text-xl">{totalWatches}</div></div>
              </div>

              {topPost && <DailyLeader post={topPost} />}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link to="/new" className="rounded-[24px] bg-cyan-500 px-5 py-4 text-center text-sm font-black shadow-2xl shadow-cyan-500/30">Luo postaus</Link>
                <Link to="/pots" className="pot-glow rounded-[24px] bg-gradient-to-r from-yellow-200 via-orange-300 to-pink-400 px-5 py-4 text-center text-sm font-black text-black">Potit</Link>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <section data-feed-card className="snap-card mx-auto flex min-h-[100dvh] max-w-md items-center">
            <div className="relative w-full overflow-hidden rounded-[34px] border border-cyan-300/20 bg-white/10 p-8 text-center font-black shadow-2xl backdrop-blur-xl">
              <BgPhoto src={FINLAND_PHOTOS.aurora} alt="Revontulet Suomessa" className="opacity-45" />
              <div className="relative">Feed latautuu...</div>
            </div>
          </section>
        )}

        {!loading && posts.length === 0 && (
          <section data-feed-card className="snap-card mx-auto flex min-h-[100dvh] max-w-md items-center">
            <div className="relative w-full overflow-hidden rounded-[34px] border border-white/10 p-8 text-center shadow-2xl">
              <BgPhoto src={FINLAND_PHOTOS.lake} alt="Suomalainen järvi" className="opacity-70" />
              <div className="absolute inset-0 bg-slate-950/72" />
              <div className="relative">
                <div className="floaty text-5xl">✨</div>
                <h2 className="mt-3 text-3xl font-black">Ei vielä postauksia</h2>
                <Link to="/new" className="mt-5 block rounded-[24px] bg-cyan-500 px-5 py-4 text-sm font-black">Luo postaus</Link>
              </div>
            </div>
          </section>
        )}

        {!loading && posts.map((post, index) => (
          <section key={post.id} data-feed-card className="snap-card mx-auto flex min-h-[100dvh] max-w-md items-center py-6">
            <PostCard post={post} index={index} voted={Boolean(voted[post.id])} onVote={vote} onShare={sharePost} onImageWatch={rewardWatch} onImageStart={startWatch} onVideoTime={handleVideoTime} active={activeIndex === index + 1} />
          </section>
        ))}
      </main>

      <div className={`fixed bottom-[116px] left-1/2 z-[60] w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[28px] border border-yellow-300/20 bg-black/65 p-3 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${hiddenChrome ? "translate-y-44" : "translate-y-0"}`}>
        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black">
          <div className="pot-glow rounded-2xl bg-yellow-300/15 p-2"><div className="safe-text text-white/45">Potti</div><div className="safe-text text-yellow-200">€{watchPot}</div></div>
          <div className="rounded-2xl bg-cyan-300/10 p-2"><div className="safe-text text-white/45">Streak</div><div className="safe-text text-cyan-200">{streak}x</div></div>
          <div className="rounded-2xl bg-pink-300/10 p-2"><div className="safe-text text-white/45">Kortti</div><div className="safe-text text-pink-200">#{Math.max(1, activeIndex)}</div></div>
          <Link to="/pots" className="rounded-2xl bg-white/10 p-2"><div className="safe-text text-white/45">Potit</div><div>🏆</div></Link>
        </div>
      </div>

      <BottomNav onPulse={() => pushEvent("⚡ Navigointi", false)} />
    </div>
  );
}

function DailyLeader({ post }) {
  return (
    <div className="mt-5 rounded-[28px] border border-yellow-300/30 bg-black/35 p-4 text-center backdrop-blur-md">
      <div className="text-xs font-black uppercase tracking-wide text-yellow-200">🏆 Päivän johtaja</div>
      <div className="mt-2 max-h-[58px] overflow-hidden text-lg font-black leading-tight text-white">{post.content}</div>
      <div className="mt-2 text-sm font-black text-yellow-300">Score {Math.round(post.score || 0)} · {post.votes || 0} ääntä</div>
    </div>
  );
}

function PostCard({ post, index, voted, onVote, onShare, onImageStart, onImageWatch, onVideoTime, active }) {
  const mediaUrl = mediaUrlFor(post);
  const mediaType = mediaTypeFor(post);
  const viralMultiplier = (1 + Math.min(0.7, Number(post.shares || 0) * 0.04 + Number(post.watch_time_total || 0) * 0.01)).toFixed(2);
  const bg = [FINLAND_PHOTOS.lake, FINLAND_PHOTOS.road, FINLAND_PHOTOS.aurora, FINLAND_PHOTOS.forest, FINLAND_PHOTOS.archipelago][index % 5];

  return (
    <article onDoubleClick={() => !voted && onVote(post)} className={`relative w-full overflow-hidden rounded-[40px] border p-[2px] shadow-2xl transition-all duration-300 ${active ? "scale-100 opacity-100" : "scale-[0.965] opacity-82"} ${index === 0 ? "border-yellow-300/60 bg-gradient-to-br from-yellow-300 via-pink-500 to-cyan-300 shadow-yellow-300/20" : "border-cyan-300/20 bg-white/10 shadow-cyan-400/10"}`}>
      <div className="relative overflow-hidden rounded-[38px] bg-[#111827]/95 p-5">
        <BgPhoto src={bg} alt="Suomalainen taustakuva" className="opacity-28" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/56 via-slate-950/72 to-slate-950/96" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-3xl text-xl font-black ${index === 0 ? "bg-yellow-300 text-black shadow-xl shadow-yellow-300/35" : "bg-cyan-500 text-white shadow-xl shadow-cyan-500/25"}`}>{rankBadge(index)}</div>
            <div className="min-w-0 flex-1 text-right">
              <p className="safe-text text-xs font-black uppercase text-cyan-200">{mediaUrl ? mediaType === "video" ? "🎥 Video" : "🖼️ Kuva" : "💬 Teksti"}</p>
              <p className="mt-1 safe-text text-xs font-black text-white/45">Score {Math.round(post.score || 0)} · Viral {viralMultiplier}x</p>
            </div>
          </div>

          <p className="mt-5 max-h-[168px] overflow-hidden whitespace-pre-wrap break-words text-[22px] font-black leading-relaxed text-white/90">{post.content}</p>

          {mediaUrl && (
            <div className="mt-5 overflow-hidden rounded-[30px] border border-white/10 bg-black/30 shadow-2xl shadow-black/30">
              {mediaType === "video" ? (
                <video src={mediaUrl} className="max-h-[50dvh] w-full object-cover" autoPlay muted loop playsInline controls={false} onPlay={() => onImageStart(post)} onTimeUpdate={(event) => onVideoTime(event, post)} />
              ) : (
                <img src={mediaUrl} alt="Post media" className="photo-in max-h-[50dvh] w-full object-cover" onLoad={() => { onImageStart(post); setTimeout(() => onImageWatch(post), 3000); }} onTouchStart={() => { onImageStart(post); setTimeout(() => onImageWatch(post), 3000); }} />
              )}
              <div className="border-t border-white/10 px-4 py-3 text-xs font-black text-pink-100">👀 3s katselu → +XP · kasvattaa pottia</div>
            </div>
          )}

          {!mediaUrl && (
            <div className="mt-5 rounded-[30px] border border-cyan-300/15 bg-black/30 p-5 text-sm font-black text-cyan-100 backdrop-blur-md">
              🇫🇮 Tekstipostaus on mukana kilpailussa. Double tap antaa äänen nopeasti.
            </div>
          )}

          <div className="mt-5 grid grid-cols-4 gap-2 text-center text-[10px] font-black">
            <div className="rounded-2xl bg-black/40 p-3"><div className="safe-text text-white/45">ÄÄNET</div><div className="mt-1 text-xl">{post.votes}</div></div>
            <div className="rounded-2xl bg-black/40 p-3"><div className="safe-text text-white/45">KATSELUT</div><div className="mt-1 text-xl text-pink-300">{post.watch_time_total || 0}</div></div>
            <div className="rounded-2xl bg-black/40 p-3"><div className="safe-text text-white/45">JAOT</div><div className="mt-1 text-xl text-cyan-200">{post.shares || 0}</div></div>
            <div className="rounded-2xl bg-black/40 p-3"><div className="safe-text text-white/45">SIJA</div><div className="mt-1 text-xl">#{index + 1}</div></div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => onVote(post)} disabled={voted} className="rounded-[24px] bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-4 text-base font-black text-white shadow-2xl shadow-cyan-500/25 transition active:scale-[0.98] disabled:bg-none disabled:bg-white/10 disabled:text-white/40">{voted ? "Äänestetty" : "Tykkää +XP"}</button>
            <button type="button" onClick={() => onShare(post)} className="rounded-[24px] bg-gradient-to-r from-pink-500 to-fuchsia-600 px-4 py-4 text-base font-black text-white shadow-2xl shadow-pink-500/25 transition active:scale-[0.98]">Jaa +Boost</button>
          </div>

          <p className="mt-3 text-center text-[10px] font-black uppercase tracking-wide text-white/35">Double tap = tykkää nopeasti</p>
        </div>
      </div>
    </article>
  );
}
