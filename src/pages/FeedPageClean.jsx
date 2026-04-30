import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { haptic } from "../lib/effects";

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
      @keyframes cardGlow{0%,100%{box-shadow:0 0 22px rgba(34,211,238,.12),0 0 44px rgba(255,255,255,.03)}50%{box-shadow:0 0 30px rgba(34,211,238,.20),0 0 50px rgba(250,204,21,.08)}}
      @keyframes xpPop{0%{transform:translate(-50%,-10px) scale(.94);opacity:0}15%,85%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-10px) scale(.94);opacity:0}}
      .nav-alive{animation:navAlive 2.5s ease-in-out infinite}.plus-pulse{animation:plusPulse 2.25s ease-in-out infinite}.card-glow{animation:cardGlow 3.8s ease-in-out infinite}.xp-pop{animation:xpPop 1.8s ease both}.safe-text{min-width:0;overflow:hidden;text-overflow:ellipsis}.snap-card{scroll-snap-align:start;scroll-snap-stop:always}
    `}</style>
  );
}

function Tap({ to, children, className = "", onPulse, hapticType = "tap" }) {
  return (
    <Link data-haptic={hapticType} to={to} onClick={() => { haptic(hapticType); onPulse?.(); }} className={className}>
      {children}
    </Link>
  );
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
      <div className="suomi-card suomi-aurora relative rounded-[34px] border border-cyan-200/20 px-4 pb-4 pt-3 shadow-2xl shadow-cyan-500/15 backdrop-blur-2xl">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
        <div className="relative z-10 grid grid-cols-5 items-end text-center text-[11px] font-black">
          {items.map((item) => {
            const active = location.pathname === item.to;
            if (item.fab) {
              return (
                <Tap hapticType="heavy" onPulse={onPulse} key={item.to} to={item.to} className="-mt-12 flex flex-col items-center active:scale-95">
                  <div className="plus-pulse grid h-[86px] w-[86px] place-items-center rounded-full border-[7px] border-[#061126] bg-gradient-to-br from-cyan-100 via-sky-400 to-blue-700 text-[62px] font-black leading-none shadow-2xl shadow-cyan-400/50">+</div>
                  <div className="mt-0.5 text-white">{item.label}</div>
                </Tap>
              );
            }
            return (
              <Tap hapticType={item.haptic || "tap"} onPulse={onPulse} key={item.to} to={item.to} className={`relative flex flex-col items-center gap-1.5 rounded-3xl px-1 py-2 active:scale-95 ${active ? "text-cyan-100" : "text-white/52"}`}>
                {item.badge && <span className={`absolute -top-2 rounded-full px-2 py-0.5 text-[8px] font-black ${item.gold ? "bg-yellow-300 text-black" : "bg-pink-500 text-white"}`}>{item.badge}</span>}
                <div className={`grid h-11 w-11 place-items-center rounded-3xl text-2xl ${active ? "bg-cyan-300/15 shadow-lg shadow-cyan-300/25" : item.gold ? "bg-yellow-300/10" : "bg-white/5"} ${item.alive ? "nav-alive" : ""}`}>{item.icon}</div>
                <div>{item.label}</div>
              </Tap>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function FeedTopCard({ watchPot, activePlayers, postCount, totalWatches, topPost }) {
  return (
    <div className="suomi-card suomi-helsinki suomi-premium card-glow w-full rounded-[36px] p-5 shadow-2xl backdrop-blur-xl">
      <p className="safe-text text-xs font-black uppercase tracking-[0.24em] text-cyan-100/85">🇫🇮 Suomi · porukka · potti</p>
      <h1 className="mt-3 bg-gradient-to-r from-white via-cyan-100 to-yellow-100 bg-clip-text text-[52px] font-black leading-none text-transparent">€{watchPot}</h1>
      <p className="mt-3 text-sm font-bold leading-snug text-white/78">Postaus, ääni ja potti ovat pääroolissa. Näyttävä mutta kevyt feed.</p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black">
        <div className="rounded-2xl bg-black/35 p-3"><div className="safe-text text-white/55">Pelaajat</div><div className="mt-1 text-xl">{activePlayers}</div></div>
        <div className="rounded-2xl bg-black/35 p-3"><div className="safe-text text-white/55">Postit</div><div className="mt-1 text-xl">{postCount}</div></div>
        <div className="rounded-2xl bg-black/35 p-3"><div className="safe-text text-white/55">Katselut</div><div className="mt-1 text-xl">{totalWatches}</div></div>
      </div>
      {topPost && (
        <div className="mt-5 rounded-[26px] border border-yellow-300/25 bg-black/35 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-yellow-200">🏆 Päivän johtaja</div>
          <div className="mt-2 max-h-[52px] overflow-hidden text-base font-black leading-tight text-white">{topPost.content}</div>
          <div className="mt-2 safe-text text-sm font-black text-yellow-300">Score {Math.round(topPost.score || 0)} · {topPost.votes || 0} ääntä</div>
        </div>
      )}
    </div>
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
  const scrollerRef = useRef(null);
  const watchRef = useRef({});
  const eventAtRef = useRef(0);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    setStreak(getStreak());
    loadFeed();
    const channel = supabase
      .channel("media-feed-visual-balance")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => { pushEvent("📝 Uusi postaus feedissä", true); loadFeed(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => { pushEvent("💗 Uusi ääni muutti rankingia", true); loadFeed(); })
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
    haptic("success");
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
    try { await supabase.from("posts").update({ watch_time_total: nextCount }).eq("id", post.id); } catch (error) { console.warn("watch XP fallback", error); }
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
    pushEvent("💗 +XP · ääni annettu", true);
    await loadFeed();
  }

  async function sharePost(post) {
    const url = `${window.location.origin}/feed?post=${post.id}&ref=${user?.id || "share"}`;
    try {
      if (navigator.share) await navigator.share({ title: "KOLEHTI", text: post.content, url });
      else await navigator.clipboard?.writeText(url);
      pushEvent("🚀 Jaettu · viral multiplier kasvaa", true);
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
    <div className="h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <Styles />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#0f2c5f_0%,#050816_42%,#02030a_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(34,211,238,.08),transparent_38%,rgba(250,204,21,.05))]" />
      {event && <div className="xp-pop fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm rounded-[26px] border border-cyan-300/30 bg-black/78 px-5 py-4 text-center text-sm font-black text-white shadow-2xl shadow-cyan-400/20 backdrop-blur-xl">{event.text}</div>}
      <main id="feed-scroll-root" ref={scrollerRef} className="h-[100dvh] snap-y snap-mandatory overflow-y-auto scroll-smooth px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section data-feed-card className="snap-card mx-auto flex min-h-[100dvh] max-w-md items-start pb-[164px] pt-6"><FeedTopCard watchPot={watchPot} activePlayers={activePlayers} postCount={posts.length} totalWatches={totalWatches} topPost={topPost} /></section>
        {loading && <section data-feed-card className="snap-card mx-auto flex min-h-[100dvh] max-w-md items-center pb-[164px]"><div className="suomi-card suomi-lake w-full rounded-[34px] p-8 text-center font-black shadow-2xl">Feed latautuu...</div></section>}
        {!loading && posts.length === 0 && <section data-feed-card className="snap-card mx-auto flex min-h-[100dvh] max-w-md items-center pb-[164px]"><div className="suomi-card suomi-aurora w-full rounded-[34px] p-8 text-center shadow-2xl"><div className="text-5xl">✨</div><h2 className="mt-3 text-3xl font-black">Ei vielä postauksia</h2><Link to="/new" className="mt-5 block rounded-[24px] bg-cyan-500 px-5 py-4 text-sm font-black">Luo postaus</Link></div></section>}
        {!loading && posts.map((post, index) => <section key={post.id} data-feed-card className="snap-card mx-auto flex min-h-[100dvh] max-w-md items-start pb-[164px] pt-6"><PostCard post={post} index={index} voted={Boolean(voted[post.id])} onVote={vote} onShare={sharePost} onImageWatch={rewardWatch} onImageStart={startWatch} onVideoTime={handleVideoTime} active={activeIndex === index + 1} /></section>)}
      </main>
      <BottomNav hidden={hiddenChrome} onPulse={() => pushEvent("⚡ Navigointi", false)} />
    </div>
  );
}

function PostCard({ post, index, voted, onVote, onShare, onImageStart, onImageWatch, onVideoTime, active }) {
  const mediaUrl = mediaUrlFor(post);
  const mediaType = mediaTypeFor(post);
  const viralMultiplier = (1 + Math.min(0.7, Number(post.shares || 0) * 0.04 + Number(post.watch_time_total || 0) * 0.01)).toFixed(2);
  const visualCard = index % 3 === 0;
  const cardClass = visualCard ? ["suomi-card suomi-lake", "suomi-card suomi-forest", "suomi-card suomi-aurora"][Math.floor(index / 3) % 3] : "bg-white/[0.075]";

  return (
    <article onDoubleClick={() => !voted && onVote(post)} className={`w-full overflow-hidden rounded-[36px] border p-[2px] shadow-2xl backdrop-blur-xl transition-all duration-300 ${active ? "scale-100 opacity-100" : "scale-[0.985] opacity-95"} ${index === 0 ? "border-yellow-300/45 shadow-yellow-300/10" : "border-cyan-200/15 shadow-cyan-400/10"} ${cardClass}`}>
      <div className="rounded-[34px] bg-[#08111f]/82 p-5">
        <div className="flex items-start justify-between gap-3"><div className={`grid h-16 w-16 shrink-0 place-items-center rounded-3xl text-xl font-black ${index === 0 ? "bg-yellow-300 text-black shadow-xl shadow-yellow-300/30" : "bg-cyan-500 text-white shadow-xl shadow-cyan-500/25"}`}>{rankBadge(index)}</div><div className="min-w-0 flex-1 text-right"><p className="safe-text text-xs font-black uppercase text-cyan-100">{mediaUrl ? mediaType === "video" ? "🎥 Video" : "🖼️ Kuva" : visualCard ? "🇫🇮 Suomi-kortti" : "💬 Teksti"}</p><p className="mt-1 safe-text text-xs font-black text-white/50">Score {Math.round(post.score || 0)} · Viral {viralMultiplier}x</p></div></div>
        {mediaUrl && <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/35 shadow-2xl shadow-black/30">{mediaType === "video" ? <video src={mediaUrl} className="max-h-[42dvh] w-full object-cover" autoPlay muted loop playsInline controls={false} onPlay={() => onImageStart(post)} onTimeUpdate={(event) => onVideoTime(event, post)} /> : <img src={mediaUrl} alt="Post media" className="max-h-[42dvh] w-full object-cover" loading="lazy" decoding="async" onLoad={() => { onImageStart(post); setTimeout(() => onImageWatch(post), 3000); }} onTouchStart={() => { onImageStart(post); setTimeout(() => onImageWatch(post), 3000); }} />}<div className="border-t border-white/10 px-4 py-3 text-xs font-black text-cyan-100/80">👀 3s katselu → +XP · kasvattaa pottia</div></div>}
        <p className="mt-5 max-h-[210px] overflow-hidden whitespace-pre-wrap break-words text-[22px] font-black leading-snug text-white/92">{post.content}</p>
        {!mediaUrl && <div className="mt-5 rounded-[26px] border border-cyan-200/15 bg-black/25 p-4 text-sm font-black text-cyan-50/90">🇫🇮 Tekstipostaus mukana kilpailussa. Double tap antaa äänen nopeasti.</div>}
        <div className="mt-5 grid grid-cols-4 gap-2 text-center text-[10px] font-black"><div className="rounded-2xl bg-black/32 p-2.5"><div className="safe-text text-white/45">ÄÄNET</div><div className="mt-1 text-lg">{post.votes}</div></div><div className="rounded-2xl bg-black/32 p-2.5"><div className="safe-text text-white/45">KATSELUT</div><div className="mt-1 text-lg text-pink-300">{post.watch_time_total || 0}</div></div><div className="rounded-2xl bg-black/32 p-2.5"><div className="safe-text text-white/45">JAOT</div><div className="mt-1 text-lg text-cyan-200">{post.shares || 0}</div></div><div className="rounded-2xl bg-black/32 p-2.5"><div className="safe-text text-white/45">SIJA</div><div className="mt-1 text-lg">#{index + 1}</div></div></div>
        <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" data-haptic="success" onClick={() => { haptic("success"); onVote(post); }} disabled={voted} className="rounded-[22px] bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-2xl shadow-cyan-500/25 transition active:scale-[0.98] disabled:bg-none disabled:bg-white/10 disabled:text-white/40">{voted ? "Äänestetty" : "Tykkää +XP"}</button><button type="button" data-haptic="heavy" onClick={() => { haptic("heavy"); onShare(post); }} className="rounded-[22px] bg-gradient-to-r from-pink-500 to-fuchsia-600 px-4 py-3.5 text-sm font-black text-white shadow-2xl shadow-pink-500/25 transition active:scale-[0.98]">Jaa +Boost</button></div>
        <p className="mt-3 text-center text-[10px] font-black uppercase tracking-wide text-white/35">Double tap = tykkää nopeasti</p>
      </div>
    </article>
  );
}
