import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { haptic, reward } from "../lib/effects";

const FIN_BG = [
  "https://commons.wikimedia.org/wiki/Special:FilePath/Helsinki_skyline_(Sep_2024_-_01).jpg?width=900",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=900",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=900",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Aurora_borealis_(21868630118).jpg?width=900",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Road_in_Finland.jpg?width=900",
];

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

function Styles() {
  return (
    <style>{`
      @keyframes navAlive{0%,100%{opacity:.74;transform:scale(1)}50%{opacity:1;transform:scale(1.07)}}
      @keyframes plusPulse{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.055)}}
      @keyframes xpPop{0%{transform:translate(-50%,-10px) scale(.94);opacity:0}15%,85%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-10px) scale(.94);opacity:0}}
      @keyframes sidePulse{0%,100%{transform:scale(1);box-shadow:0 14px 30px rgba(0,0,0,.25)}50%{transform:scale(1.055);box-shadow:0 18px 42px rgba(34,211,238,.22)}}
      @keyframes heartFloat{0%{transform:translateY(0) scale(.8);opacity:0}18%{opacity:1}100%{transform:translateY(-92px) scale(1.35);opacity:0}}
      .nav-alive{animation:navAlive 2.5s ease-in-out infinite}.plus-pulse{animation:plusPulse 2.25s ease-in-out infinite}.xp-pop{animation:xpPop 1.8s ease both}.snap-card{scroll-snap-align:start;scroll-snap-stop:always}.action-pulse{animation:sidePulse 3s ease-in-out infinite}.safe-text{min-width:0;overflow:hidden;text-overflow:ellipsis}.heart-float{animation:heartFloat .9s ease-out both}
    `}</style>
  );
}

function Tap({ to, children, className = "", onPulse, hapticType = "tap" }) {
  return <Link data-haptic={hapticType} to={to} onClick={() => { haptic(hapticType); onPulse?.(); }} className={className}>{children}</Link>;
}

function BottomNav({ hidden, onPulse }) {
  const location = useLocation();
  const items = [
    { to: "/", icon: "⌂", label: "Koti", alive: true },
    { to: "/feed", icon: "🔥", label: "Feed", badge: "LIVE" },
    { to: "/new", icon: "+", label: "Uusi", fab: true, haptic: "heavy" },
    { to: "/pots", icon: "🏆", label: "Potit", badge: "HOT", gold: true, haptic: "success" },
    { to: "/profile", icon: "●", label: "Profiili", alive: true },
  ];
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-[70] mx-auto max-w-md px-5 pb-[max(14px,env(safe-area-inset-bottom))] text-white transition-transform duration-300 ease-out ${hidden ? "translate-y-[132%]" : "translate-y-0"}`}>
      <div className="relative overflow-hidden rounded-[34px] border border-cyan-200/20 bg-[#061126]/90 px-4 pb-4 pt-3 shadow-2xl shadow-cyan-500/15 backdrop-blur-2xl">
        <img src={FIN_BG[3]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" loading="lazy" decoding="async" />
        <div className="absolute inset-0 bg-[#061126]/72" />
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
        <div className="relative z-10 grid grid-cols-5 items-end text-center text-[11px] font-black">
          {items.map((item) => {
            const active = location.pathname === item.to;
            if (item.fab) return <Tap hapticType="heavy" onPulse={onPulse} key={item.to} to={item.to} className="-mt-12 flex flex-col items-center active:scale-95"><div className="plus-pulse grid h-[86px] w-[86px] place-items-center rounded-full border-[7px] border-[#061126] bg-gradient-to-br from-cyan-100 via-sky-400 to-blue-700 text-[62px] font-black leading-none shadow-2xl shadow-cyan-400/50">+</div><div className="mt-0.5 text-white">{item.label}</div></Tap>;
            return <Tap hapticType={item.haptic || "tap"} onPulse={onPulse} key={item.to} to={item.to} className={`relative flex flex-col items-center gap-1.5 rounded-3xl px-1 py-2 active:scale-95 ${active ? "text-cyan-100" : "text-white/52"}`}>{item.badge && <span className={`absolute -top-2 rounded-full px-2 py-0.5 text-[8px] font-black ${item.gold ? "bg-yellow-300 text-black" : "bg-pink-500 text-white"}`}>{item.badge}</span>}<div className={`grid h-11 w-11 place-items-center rounded-3xl text-2xl ${active ? "bg-cyan-300/15 shadow-lg shadow-cyan-300/25" : item.gold ? "bg-yellow-300/10" : "bg-white/5"} ${item.alive ? "nav-alive" : ""}`}>{item.icon}</div><div>{item.label}</div></Tap>;
          })}
        </div>
      </div>
    </nav>
  );
}

function IntroSlide({ watchPot, activePlayers, postCount, totalWatches, topPost }) {
  return (
    <section data-feed-card className="snap-card relative h-[100dvh] overflow-hidden">
      <img src={FIN_BG[0]} alt="Helsinki" className="absolute inset-0 h-full w-full object-cover" loading="eager" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#061126]/55 to-black/92" />
      <div className="absolute inset-x-0 top-0 p-5 pt-[max(24px,env(safe-area-inset-top))]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/90">🇫🇮 KOLEHTI LIVE</p>
        <h1 className="mt-3 text-[64px] font-black leading-none text-white drop-shadow-2xl">€{watchPot}</h1>
        <p className="mt-2 max-w-[280px] text-base font-black leading-snug text-white/82">Päivän potti. Swipeaa alas ja äänestä paras perustelu.</p>
      </div>
      <div className="absolute bottom-[150px] left-5 right-5 rounded-[30px] border border-white/15 bg-black/38 p-4 backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
          <div><div className="text-white/55">Pelaajat</div><div className="mt-1 text-2xl">{activePlayers}</div></div>
          <div><div className="text-white/55">Postit</div><div className="mt-1 text-2xl">{postCount}</div></div>
          <div><div className="text-white/55">Katselut</div><div className="mt-1 text-2xl">{totalWatches}</div></div>
        </div>
        {topPost && <div className="mt-4 rounded-2xl bg-yellow-300/12 p-3 text-sm font-black text-yellow-100">🏆 Kärjessä: {topPost.content.slice(0, 70)}...</div>}
      </div>
    </section>
  );
}

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);
  const [voted, setVoted] = useState({});
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [streak, setStreak] = useState(1);
  const [hiddenChrome, setHiddenChrome] = useState(false);
  const [floatingHeart, setFloatingHeart] = useState(null);
  const scrollerRef = useRef(null);
  const watchRef = useRef({});
  const eventAtRef = useRef(0);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    setStreak(getStreak());
    loadFeed();
    const channel = supabase
      .channel("feed-fullscreen-tiktok-mode")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => { pushEvent("📝 Uusi postaus feedissä", true); loadFeed(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => { reward("like"); pushEvent("💗 Uusi ääni muutti rankingia", true); loadFeed(); })
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
          if (distance < best) { best = distance; next = index; }
        });
        const delta = el.scrollTop - lastScrollRef.current;
        if (delta > 8 && el.scrollTop > 80) setHiddenChrome(true);
        if (delta < -8 || el.scrollTop < 40) setHiddenChrome(false);
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
      const prepared = (postData || []).map((post) => normalizePost(post, voteMap[post.id] || 0)).filter(Boolean).map((post) => ({ ...post, score: personalizedScorePost(post, currentUser?.id, votedMap), rawScore: scorePost(post) })).sort((a, b) => b.score - a.score);
      setPosts(prepared);
      setVotes(voteData || []);
      setVoted(votedMap);
    } catch (error) {
      console.warn("feed load failed", error);
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
    haptic("success");
    setTimeout(() => setEvent(null), 1800);
  }

  function showFloatingHeart() {
    const id = Date.now();
    setFloatingHeart(id);
    setTimeout(() => setFloatingHeart(null), 950);
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
    reward("reward");
    pushEvent(`👀 +2 XP · streak ${streak}x`, true);
    const nextCount = Number(post.watch_time_total || 0) + 1;
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, watch_time_total: nextCount, score: scorePost({ ...p, watch_time_total: nextCount }) } : p).sort((a, b) => b.score - a.score));
    try { await supabase.from("posts").update({ watch_time_total: nextCount }).eq("id", post.id); } catch (error) { console.warn("watch update skipped", error); }
  }

  function handleVideoTime(event, post) {
    startWatch(post);
    if (Number(event?.target?.currentTime || 0) >= 3) rewardWatch(post);
  }

  async function vote(post) {
    if (!user) { pushEvent("Kirjaudu ensin sisään", true); return; }
    if (voted[post.id]) { pushEvent("Olet jo äänestänyt tämän", true); return; }
    const { error } = await supabase.from("votes").insert({ post_id: post.id, user_id: user.id, value: 1 });
    if (error) { pushEvent(error.message || "Äänestys epäonnistui", true); return; }
    setVoted((prev) => ({ ...prev, [post.id]: true }));
    reward("like");
    showFloatingHeart();
    pushEvent("💙 +XP · ääni annettu", true);
    await loadFeed();
  }

  async function sharePost(post) {
    const url = `${window.location.origin}/feed?post=${post.id}&ref=${user?.id || "share"}`;
    try {
      if (navigator.share) await navigator.share({ title: "KOLEHTI", text: post.content, url });
      else await navigator.clipboard?.writeText(url);
      reward("superlike");
      pushEvent("🚀 Jaettu · boost kasvaa", true);
      const nextShares = Number(post.shares || 0) + 1;
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, shares: nextShares, score: scorePost({ ...p, shares: nextShares }) } : p).sort((a, b) => b.score - a.score));
      try { await supabase.from("posts").update({ shares: nextShares, boost_score: Number(post.boost_score || 0) + 5 }).eq("id", post.id); } catch (error) { console.warn("share update skipped", error); }
    } catch { pushEvent("Jakoa ei tehty", true); }
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
    <div className="h-[100dvh] overflow-hidden bg-black text-white">
      <Styles />
      {event && <div className="xp-pop fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm rounded-[26px] border border-cyan-300/30 bg-black/78 px-5 py-4 text-center text-sm font-black text-white shadow-2xl shadow-cyan-400/20 backdrop-blur-xl">{event.text}</div>}
      {floatingHeart && <div key={floatingHeart} className="heart-float pointer-events-none fixed bottom-[220px] right-[38px] z-[95] text-[70px] drop-shadow-[0_0_28px_rgba(34,211,238,.9)]">💙</div>}
      <main id="feed-scroll-root" ref={scrollerRef} className="h-[100dvh] snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <IntroSlide watchPot={watchPot} activePlayers={activePlayers} postCount={posts.length} totalWatches={totalWatches} topPost={topPost} />
        {loading && <section data-feed-card className="snap-card grid h-[100dvh] place-items-center bg-[#050816] px-5"><div className="suomi-card suomi-lake w-full max-w-sm rounded-[34px] p-8 text-center font-black shadow-2xl">Feed latautuu...</div></section>}
        {!loading && posts.length === 0 && <section data-feed-card className="snap-card grid h-[100dvh] place-items-center bg-[#050816] px-5"><div className="suomi-card suomi-aurora w-full max-w-sm rounded-[34px] p-8 text-center shadow-2xl"><div className="text-5xl">✨</div><h2 className="mt-3 text-3xl font-black">Ei vielä postauksia</h2><Link to="/new" className="mt-5 block rounded-[24px] bg-cyan-500 px-5 py-4 text-sm font-black">Luo postaus</Link></div></section>}
        {!loading && posts.map((post, index) => <TikTokCard key={post.id} post={post} index={index} voted={Boolean(voted[post.id])} onVote={vote} onShare={sharePost} onImageWatch={rewardWatch} onImageStart={startWatch} onVideoTime={handleVideoTime} active={activeIndex === index + 1} />)}
      </main>
      <BottomNav hidden={hiddenChrome} onPulse={() => pushEvent("⚡ Navigointi", false)} />
    </div>
  );
}

function TikTokCard({ post, index, voted, onVote, onShare, onImageStart, onImageWatch, onVideoTime, active }) {
  const mediaUrl = mediaUrlFor(post);
  const mediaType = mediaTypeFor(post);
  const fallback = FIN_BG[index % FIN_BG.length];
  const viralMultiplier = (1 + Math.min(0.7, Number(post.shares || 0) * 0.04 + Number(post.watch_time_total || 0) * 0.01)).toFixed(2);

  return (
    <section data-feed-card className="snap-card relative h-[100dvh] overflow-hidden bg-black">
      {mediaUrl && mediaType === "video" ? (
        <video src={mediaUrl} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline controls={false} onPlay={() => onImageStart(post)} onTimeUpdate={(event) => onVideoTime(event, post)} />
      ) : (
        <img src={mediaUrl || fallback} alt="Post media" className="absolute inset-0 h-full w-full object-cover" loading={index < 2 ? "eager" : "lazy"} decoding="async" onLoad={() => { onImageStart(post); setTimeout(() => onImageWatch(post), 3000); }} onTouchStart={() => { onImageStart(post); setTimeout(() => onImageWatch(post), 3000); }} />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/22 via-black/16 to-black/88" />
      <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-black/45 to-transparent" />

      <div className="absolute left-4 right-[92px] top-[max(20px,env(safe-area-inset-top))] z-10 flex items-center justify-between gap-3">
        <div className="rounded-full border border-white/15 bg-black/32 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-cyan-100 backdrop-blur-xl">{rankBadge(index)} · Score {Math.round(post.score || 0)}</div>
        {active && <div className="rounded-full bg-green-400 px-3 py-1 text-[10px] font-black text-black shadow-lg shadow-green-400/25">LIVE</div>}
      </div>

      <aside className="absolute bottom-[156px] right-4 z-20 flex flex-col items-center gap-4">
        <button data-haptic="success" onClick={() => { haptic("success"); onVote(post); }} disabled={voted} className={`action-pulse grid h-[62px] w-[62px] place-items-center rounded-full border border-white/15 text-3xl shadow-2xl backdrop-blur-xl active:scale-95 ${voted ? "bg-white/18 text-white/45" : "bg-blue-500/92 text-white"}`}>♥</button>
        <div className="-mt-3 text-center text-[11px] font-black text-white drop-shadow">{post.votes}</div>
        <button data-haptic="heavy" onClick={() => { haptic("heavy"); onShare(post); }} className="grid h-[58px] w-[58px] place-items-center rounded-full border border-white/15 bg-cyan-500/88 text-2xl shadow-2xl backdrop-blur-xl active:scale-95">↗</button>
        <div className="-mt-3 text-center text-[11px] font-black text-white drop-shadow">{post.shares || 0}</div>
        <Link data-haptic="tap" to="/pots" className="grid h-[54px] w-[54px] place-items-center rounded-full border border-yellow-200/30 bg-yellow-300/92 text-2xl text-black shadow-2xl shadow-yellow-300/25 backdrop-blur-xl active:scale-95">🏆</Link>
      </aside>

      <div className="absolute bottom-[150px] left-4 right-[94px] z-10">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="premium-chip bg-black/35">{mediaUrl ? mediaType === "video" ? "🎥 Video" : "🖼️ Kuva" : "🇫🇮 Suomi"}</span>
          <span className="premium-chip bg-black/35">Viral {viralMultiplier}x</span>
          <span className="premium-chip bg-black/35">👀 {post.watch_time_total || 0}</span>
        </div>
        <p className="max-h-[210px] overflow-hidden whitespace-pre-wrap break-words text-[24px] font-black leading-tight text-white drop-shadow-2xl">{post.content}</p>
        <div className="mt-4 flex gap-2 text-[11px] font-black text-white/72">
          <span className="rounded-full bg-black/35 px-3 py-1.5 backdrop-blur-xl">#{index + 1}</span>
          <span className="rounded-full bg-black/35 px-3 py-1.5 backdrop-blur-xl">Double tap = tykkää</span>
        </div>
      </div>
    </section>
  );
}
