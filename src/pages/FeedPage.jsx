import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getReferralLink } from "../lib/referral";
import ForYouCard from "../components/ForYouCard";
import BoostEventBanner from "../components/BoostEventBanner";
import DailyWinnerBanner from "../components/DailyWinnerBanner";
import WinnerHypeModal from "../components/WinnerHypeModal";
import { rankForYou } from "../lib/tiktokAI";
import { getSmartFeed } from "../lib/smartFeed";
import { updateStreak } from "../lib/streak";
import { trackRetentionEvent } from "../lib/retention";
import { rewardVote, rewardTopRank } from "../lib/progression";
import { calculateRankInfo, updatePostRankStats, notifyAlmostWin } from "../lib/almostWin";
import { getTodayWinner } from "../lib/dailyWinner";
import { cleanupExpiredBoostEvents, createRandomBoostEvent, getActiveBoostEvent } from "../lib/boostEvents";
import { runViralLoopV3 } from "../lib/viralLoop";
import { optimizeFeedForGrowthAsync, trackTopGrowthImpressions } from "../lib/aiGrowthOptimizer";
import { getUserSegment } from "../lib/userSegment";
import { sendSegmentMessage } from "../lib/segmentMessages";

const FEED_VERSION = "CRASH PROOF FEED 2026-04-28";

const starterPosts = [
  {
    id: "starter-1",
    content: "Kun yksi ihminen saa apua oikealla hetkellä, koko porukka vahvistuu. Siksi tämän pelin pitäisi nostaa esiin ne perustelut, jotka koskettavat aidosti.",
    user_id: "starter-ai",
    group_id: null,
    votes: 12,
    vote_count: 12,
    growth_score: 92,
    boost_score: 18,
    ai_score: 91,
    is_starter: true,
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "starter-2",
    content: "Hyvä perustelu ei ole pisin teksti. Se on sellainen, jonka jälkeen toinen pelaaja ajattelee: tämän minä ymmärrän ja tätä haluan tukea.",
    user_id: "starter-ai",
    group_id: null,
    votes: 9,
    vote_count: 9,
    growth_score: 84,
    boost_score: 10,
    ai_score: 86,
    is_starter: true,
    created_at: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
  },
  {
    id: "starter-3",
    content: "Porukan voima syntyy siitä, että ääni ei mene vain äänekkäimmälle vaan sille, joka saa muut mukaan.",
    user_id: "starter-ai",
    group_id: null,
    votes: 7,
    vote_count: 7,
    growth_score: 76,
    boost_score: 8,
    ai_score: 79,
    is_starter: true,
    created_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
  },
];

function normalizePost(post, voteCount = 0) {
  if (!post || typeof post !== "object") return null;

  const id = post.id || post.post_id || `local-${Math.random().toString(36).slice(2)}`;
  const rawContent = post.content ?? post.text ?? post.body ?? post.message ?? "";
  const content = String(rawContent || "").trim();

  if (!id || !content) return null;

  return {
    ...post,
    id,
    content,
    user_id: post.user_id || post.author_id || "unknown-user",
    group_id: post.group_id || null,
    created_at: post.created_at || new Date().toISOString(),
    votes: Number(post.votes || post.vote_count || voteCount || 0),
    vote_count: Number(post.vote_count || post.votes || voteCount || 0),
    growth_score: Number(post.growth_score || post.ai_score || 0),
    boost_score: Number(post.boost_score || 0),
    ai_score: Number(post.ai_score || post.growth_score || 0),
    image_url: post.image_url || post.photo_url || null,
  };
}

function sanitizePosts(list) {
  const safe = (Array.isArray(list) ? list : [])
    .map((post) => normalizePost(post, post?.vote_count || post?.votes || 0))
    .filter(Boolean);

  const seen = new Set();
  return safe.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}

function buildAlwaysAliveFeed(realPosts) {
  const real = sanitizePosts(realPosts);
  const needed = Math.max(0, 5 - real.length);
  return sanitizePosts([...real, ...starterPosts.slice(0, needed)]);
}

function BottomNav({ hidden }) {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[30px] border border-white/10 bg-[#061126]/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out ${hidden ? "translate-y-full" : "translate-y-0"}`}>
      <div className="grid grid-cols-5 items-end text-center text-xs font-black">
        <Link to="/">🏠<div>Koti</div></Link>
        <Link to="/feed" className="text-cyan-300">🔥<div>Feed</div></Link>
        <Link to="/new" className="-mt-8"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">+</div><div>Uusi</div></Link>
        <Link to="/pots">🏆<div>Potit</div></Link>
        <Link to="/profile">👤<div>Profiili</div></Link>
      </div>
    </nav>
  );
}

function FloatingActions({ hidden, onInvite }) {
  return (
    <div className={`fixed right-3 top-[38%] z-50 flex flex-col gap-3 transition-all duration-300 ease-out ${hidden ? "translate-x-[125%] opacity-0" : "translate-x-0 opacity-100"}`}>
      <button onClick={onInvite} className="grid h-14 w-14 place-items-center rounded-2xl border border-green-300/30 bg-green-500 text-xl font-black text-white shadow-2xl shadow-green-500/25 active:scale-95" aria-label="Kutsu ja boostaa">🚀</button>
      <Link to="/new" className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-500 text-3xl font-black text-white shadow-2xl shadow-cyan-500/25 active:scale-95" aria-label="Luo uusi">+</Link>
    </div>
  );
}

function MiniLeaderboard({ posts }) {
  const topPosts = sanitizePosts(posts).filter((p) => !p.is_starter).slice(0, 3);
  if (!topPosts.length) return null;

  return (
    <section className="rounded-[26px] border border-yellow-300/20 bg-yellow-400/10 px-4 py-3 shadow-xl backdrop-blur-xl">
      <div className="mb-2 text-xs font-black uppercase tracking-wide text-yellow-200">🏆 TOP 3 nyt</div>
      <div className="space-y-2">
        {topPosts.map((post, index) => (
          <div key={post.id} className="flex items-center justify-between gap-2 text-xs font-black text-white/75">
            <span className="text-yellow-200">#{index + 1}</span>
            <span className="min-w-0 flex-1 truncate">{post.content}</span>
            <span>{post.vote_count || post.votes || 0} 💗</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeedProgress({ activeIndex, total, onJump, hidden }) {
  if (!total) return null;
  return (
    <div className={`fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 transition-all duration-300 ${hidden ? "translate-x-[120%] opacity-0" : "opacity-100"}`}>
      {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
        <button key={i} onClick={() => onJump(i)} className={`h-2 rounded-full transition-all ${activeIndex === i ? "w-5 bg-cyan-300" : "w-2 bg-white/25"}`} aria-label={`Siirry korttiin ${i + 1}`} />
      ))}
    </div>
  );
}

function FallbackCard() {
  return (
    <section className="mx-auto max-w-md rounded-[34px] border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
      <div className="text-6xl">✨</div>
      <h2 className="mt-4 text-3xl font-black">Ei vielä perusteluja</h2>
      <p className="mt-3 text-sm font-bold leading-relaxed text-white/60">Luo ensimmäinen perustelu ja käynnistä kilpailu.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/new" className="flex-1 rounded-2xl bg-cyan-500 px-4 py-4 text-center font-black text-white">Luo uusi</Link>
        <Link to="/pots" className="flex-1 rounded-2xl bg-white/10 px-4 py-4 text-center font-black text-white">Potit</Link>
      </div>
    </section>
  );
}

function SafePostCard({ post, index, user, voted, rankInfo, onVote }) {
  try {
    const safePost = normalizePost(post);
    if (!safePost) return <FallbackCard />;
    return <ForYouCard post={safePost} index={index} user={user} voted={voted} rankInfo={rankInfo || { rank: index + 1 }} onVote={onVote} />;
  } catch (error) {
    console.warn("ForYouCard fallback:", error);
    return <FallbackCard />;
  }
}

export default function FeedPage() {
  const scrollerRef = useRef(null);
  const activeStartedAtRef = useRef(Date.now());
  const activeTrackedRef = useRef({});
  const touchRef = useRef({ startY: 0, lastY: 0, startTime: 0 });
  const preloadRef = useRef({});
  const behaviorRef = useRef({ fastScrolls: 0, slowReads: 0, reorderCooldown: 0 });

  const [posts, setPosts] = useState([]);
  const [voted, setVoted] = useState({});
  const [user, setUser] = useState(null);
  const [dailyWinner, setDailyWinner] = useState(null);
  const [winnerPopup, setWinnerPopup] = useState(null);
  const [boostEvent, setBoostEvent] = useState(null);
  const [segmentMessage, setSegmentMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [uiHidden, setUiHidden] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [swipePulse, setSwipePulse] = useState(0);
  const [preloaded, setPreloaded] = useState({});

  const safePosts = useMemo(() => buildAlwaysAliveFeed(posts), [posts]);
  const topRealPosts = useMemo(() => safePosts.filter((p) => !p.is_starter), [safePosts]);

  useEffect(() => {
    loadFeed();
    const channel = supabase
      .channel("kolehti-crash-proof-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, loadFeed)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let lastTop = scroller.scrollTop;
    let ticking = false;

    function updateActiveCard() {
      const cards = Array.from(scroller.querySelectorAll("[data-feed-card]"));
      const viewportMiddle = scroller.scrollTop + scroller.clientHeight / 2;
      let nextIndex = activeIndex;
      let bestDistance = Infinity;

      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetTop + card.offsetHeight / 2 - viewportMiddle);
        if (distance < bestDistance) {
          bestDistance = distance;
          nextIndex = index;
        }
      });

      const delta = scroller.scrollTop - lastTop;
      if (delta > 8 && scroller.scrollTop > 120) setUiHidden(true);
      if (delta < -8 || scroller.scrollTop < 60) setUiHidden(false);
      lastTop = Math.max(0, scroller.scrollTop);

      setActiveIndex((prev) => {
        if (prev !== nextIndex) {
          const duration = Date.now() - activeStartedAtRef.current;
          if (duration < 1200) behaviorRef.current.fastScrolls += 1;
          else behaviorRef.current.slowReads += 1;

          navigator.vibrate?.(12);
          setSwipePulse((v) => v + 1);
          activeStartedAtRef.current = Date.now();
          preloadNext(nextIndex);
          maybeReorderFeed(nextIndex);
          trackFocus(nextIndex);
        }
        return nextIndex;
      });
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveCard);
        ticking = true;
      }
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    updateActiveCard();
    preloadNext(activeIndex);
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [safePosts.length, user?.id, activeIndex]);

  useEffect(() => {
    const activePost = safePosts[activeIndex];
    if (!activePost || activePost.is_starter) return;
    const timer = setTimeout(() => {
      safeCall(() => supabase.from("user_events").insert({
        user_id: user?.id || null,
        post_id: activePost.id,
        event_type: "safe_deep_watch",
        source: "feed",
        meta: { duration_ms: Date.now() - activeStartedAtRef.current, index: activeIndex },
      }));
    }, 3200);
    return () => clearTimeout(timer);
  }, [activeIndex, safePosts, user?.id]);

  async function safeCall(fn, fallback = null) {
    try {
      return await fn();
    } catch (error) {
      console.warn("Feed safe fallback:", error);
      return fallback;
    }
  }

  function trackFocus(index) {
    const activePost = safePosts[index];
    if (!activePost || activePost.is_starter || activeTrackedRef.current[activePost.id]) return;
    activeTrackedRef.current[activePost.id] = true;
    safeCall(() => supabase.from("user_events").insert({
      user_id: user?.id || null,
      post_id: activePost.id,
      event_type: "safe_card_focus",
      source: "feed",
      meta: { index, engine: FEED_VERSION },
    }));
  }

  function preloadNext(index) {
    [index + 1, index + 2, index + 3, index - 1]
      .filter((i) => i >= 0 && i < safePosts.length)
      .forEach((i) => {
        const post = safePosts[i];
        if (!post || preloadRef.current[post.id]) return;
        preloadRef.current[post.id] = true;
        if (post.image_url) {
          const img = new Image();
          img.src = post.image_url;
        }
        if (!post.is_starter) {
          safeCall(() => supabase.from("posts").select("id,votes,views,growth_score,ai_score,boost_score").eq("id", post.id).maybeSingle());
        }
        setPreloaded((prev) => ({ ...prev, [post.id]: true }));
      });
  }

  function maybeReorderFeed(currentIndex) {
    const now = Date.now();
    if (now - behaviorRef.current.reorderCooldown < 4500) return;
    if (currentIndex < 2 || safePosts.length < 5) return;

    const { fastScrolls, slowReads } = behaviorRef.current;
    const isSkimmer = fastScrolls > slowReads * 1.5 && fastScrolls >= 3;
    const isReader = slowReads >= fastScrolls && slowReads >= 2;
    if (!isSkimmer && !isReader) return;

    behaviorRef.current.reorderCooldown = now;
    setPosts((prev) => {
      const safe = sanitizePosts(prev);
      const locked = safe.slice(0, currentIndex + 1);
      const rest = safe.slice(currentIndex + 1);
      const sorted = rest.sort((a, b) => {
        const aScore = isSkimmer
          ? Number(a.growth_score || 0) * 1.4 + Number(a.boost_score || 0) + Number(a.vote_count || a.votes || 0) * 4
          : Number(a.ai_score || 0) * 1.4 + Number(a.vote_count || a.votes || 0) * 2;
        const bScore = isSkimmer
          ? Number(b.growth_score || 0) * 1.4 + Number(b.boost_score || 0) + Number(b.vote_count || b.votes || 0) * 4
          : Number(b.ai_score || 0) * 1.4 + Number(b.vote_count || b.votes || 0) * 2;
        return bScore - aScore;
      });
      return [...locked, ...sorted];
    });
  }

  function snapToCard(index, smooth = true) {
    const safeIndex = Math.max(0, Math.min(index, safePosts.length - 1));
    const card = scrollerRef.current?.querySelector(`[data-feed-card-index="${safeIndex}"]`);
    card?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  }

  function jumpToCard(index) {
    navigator.vibrate?.(10);
    snapToCard(index);
  }

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchRef.current = { startY: touch.clientY, lastY: touch.clientY, startTime: Date.now() };
    setDragging(true);
    setUiHidden(true);
  }

  function handleTouchMove(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchRef.current.lastY = touch.clientY;
  }

  function handleTouchEnd() {
    const { startY, lastY, startTime } = touchRef.current;
    const dy = startY - lastY;
    const dt = Math.max(1, Date.now() - startTime);
    const velocity = Math.abs(dy) / dt;
    const shouldSnap = Math.abs(dy) > 70 || velocity > 0.45;
    const direction = dy > 0 ? 1 : -1;
    const skip = velocity > 0.95 && Math.abs(dy) > 130 ? 2 : 1;
    setDragging(false);

    if (shouldSnap) {
      navigator.vibrate?.(skip === 2 ? [8, 18, 8, 18] : [8, 20, 8]);
      snapToCard(activeIndex + direction * skip);
      preloadNext(activeIndex + direction * skip);
    } else {
      snapToCard(activeIndex);
    }
  }

  async function handleInvite() {
    if (!user?.id) {
      setToast("Kirjaudu sisään ja saat oman kutsulinkin.");
      setTimeout(() => setToast(""), 1800);
      return;
    }
    const link = getReferralLink(user.id);
    await navigator.clipboard.writeText(link);
    await safeCall(() => supabase.from("user_events").insert({ user_id: user.id, event_type: "invite_link_copied", source: "feed" }));
    navigator.vibrate?.(25);
    setToast("🔥 Kutsu linkki kopioitu!");
    setTimeout(() => setToast(""), 2200);
  }

  async function loadFeed() {
    setLoading(true);
    await safeCall(() => cleanupExpiredBoostEvents());
    await safeCall(() => createRandomBoostEvent());

    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user || null;
    setUser(currentUser);

    if (currentUser) {
      const profileData = await safeCall(() => updateStreak(currentUser, supabase), null);
      await safeCall(() => trackRetentionEvent(currentUser.id, "feed_open"));
      const segment = await safeCall(() => getUserSegment(currentUser.id), null);
      const message = await safeCall(() => sendSegmentMessage(segment), null);
      setSegmentMessage(message || null);
      await safeCall(() => runViralLoopV3({ userId: currentUser.id, posts: safePosts.filter((p) => !p.is_starter), profile: profileData }));
    }

    const groupId = localStorage.getItem("kolehti_group_id");
    let postsQuery = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(120);
    let votesQuery = supabase.from("votes").select("post_id,user_id,value,group_id");
    let eventsQuery = supabase.from("user_events").select("*").limit(300);

    if (groupId) {
      postsQuery = postsQuery.eq("group_id", groupId);
      votesQuery = votesQuery.eq("group_id", groupId);
    }
    if (currentUser) eventsQuery = eventsQuery.eq("user_id", currentUser.id);

    const { data: postsData, error: postsError } = await postsQuery;
    const { data: votesData, error: votesError } = await votesQuery;
    const { data: eventsData } = await eventsQuery;

    if (postsError || votesError) {
      setToast(postsError?.message || votesError?.message || "Feedin lataus epäonnistui");
      setPosts(buildAlwaysAliveFeed([]));
      setLoading(false);
      return;
    }

    const voteCounts = {};
    const votedMap = {};
    (votesData || []).forEach((vote) => {
      if (!vote?.post_id) return;
      voteCounts[vote.post_id] = (voteCounts[vote.post_id] || 0) + Number(vote.value || 1);
      if (vote.user_id === currentUser?.id) votedMap[vote.post_id] = true;
    });

    const prepared = sanitizePosts(postsData).map((post) => normalizePost(post, voteCounts[post.id] || 0)).filter(Boolean);

    let optimizedFeed = [];
    try {
      const ranked = sanitizePosts(rankForYou(prepared, eventsData || []));
      const smartFeed = sanitizePosts(getSmartFeed(ranked));
      optimizedFeed = sanitizePosts(await optimizeFeedForGrowthAsync(smartFeed, { userId: currentUser?.id, voted: votedMap, groupId }));
    } catch (error) {
      console.warn("AI feed fallback used:", error);
      optimizedFeed = prepared.sort((a, b) => {
        const aScore = Number(a.vote_count || 0) * 10 + Number(a.growth_score || 0) + Number(a.boost_score || 0);
        const bScore = Number(b.vote_count || 0) * 10 + Number(b.growth_score || 0) + Number(b.boost_score || 0);
        return bScore - aScore;
      });
    }

    optimizedFeed = buildAlwaysAliveFeed(optimizedFeed);

    if (currentUser) {
      await safeCall(() => trackTopGrowthImpressions(currentUser.id, optimizedFeed.filter((p) => !p.is_starter)));
    }

    for (let i = 0; i < optimizedFeed.length; i++) {
      const post = optimizedFeed[i];
      if (!post?.is_starter) {
        await safeCall(() => updatePostRankStats(post, i + 1));
        if (currentUser && i < 3) await safeCall(() => rewardTopRank(currentUser.id, i + 1));
      }
    }

    setBoostEvent(await safeCall(() => getActiveBoostEvent(), null));
    setDailyWinner(await safeCall(() => getTodayWinner(), null));

    const { data: latestWinner } = currentUser
      ? await supabase.from("competition_winners").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      : { data: null };
    if (latestWinner) setWinnerPopup(latestWinner);

    setPosts(optimizedFeed);
    setVoted(votedMap);
    setLoading(false);
    setTimeout(() => preloadNext(0), 250);
  }

  async function vote(post) {
    const safePost = normalizePost(post);
    if (!safePost || safePost.is_starter) {
      setToast("✨ Malliperustelu. Luo oma ja kilpaile oikeasti.");
      setTimeout(() => setToast(""), 1800);
      return;
    }
    if (!user) {
      setToast("Kirjaudu ensin sisään.");
      setTimeout(() => setToast(""), 1600);
      return;
    }
    if (voted[safePost.id]) {
      setToast("Olet jo äänestänyt tämän.");
      setTimeout(() => setToast(""), 1600);
      return;
    }

    const { error } = await supabase.from("votes").insert({ post_id: safePost.id, user_id: user.id, group_id: safePost.group_id || null, value: 1 });
    if (error) {
      setToast(error.message || "Äänestys epäonnistui");
      setTimeout(() => setToast(""), 1800);
      return;
    }

    await safeCall(() => rewardVote(user.id));
    await safeCall(() => notifyAlmostWin({ userId: safePost.user_id, post: safePost }));
    await safeCall(() => supabase.from("user_events").insert({ user_id: user.id, post_id: safePost.id, event_type: "vote_growth_trigger", source: "feed" }));
    navigator.vibrate?.([20, 40, 20]);
    setToast("🔥 Ääni annettu! +5 XP");
    setTimeout(() => setToast(""), 2400);
    await loadFeed();
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_42%,#02030a_100%)]" />
      {toast && <div className="fixed left-1/2 top-5 z-[999] -translate-x-1/2 rounded-2xl border border-cyan-300/30 bg-cyan-500/20 px-5 py-3 text-sm font-black text-cyan-100 shadow-2xl backdrop-blur-xl">{toast}</div>}
      {winnerPopup && <WinnerHypeModal winner={winnerPopup} onClose={() => setWinnerPopup(null)} />}
      {swipePulse > 0 && <div key={swipePulse} className="pointer-events-none fixed inset-x-0 top-1/2 z-[60] mx-auto h-20 max-w-md -translate-y-1/2 rounded-full bg-cyan-300/10 blur-2xl animate-ping" />}

      <header className={`fixed left-0 right-0 top-[60px] z-40 border-b border-white/10 bg-[#050816]/85 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-xl transition-transform duration-300 ${uiHidden || dragging ? "-translate-y-[108%]" : "translate-y-0"}`}>
        <div className="mx-auto max-w-md">
          <h1 className="text-3xl font-black tracking-tight">KOLEHTI</h1>
          <p className="text-[10px] font-black uppercase text-white/50">{FEED_VERSION}</p>
        </div>
      </header>

      <FloatingActions hidden={uiHidden || dragging} onInvite={handleInvite} />
      <FeedProgress activeIndex={activeIndex} total={safePosts.length} onJump={jumpToCard} hidden={uiHidden || dragging} />

      <main
        ref={scrollerRef}
        id="feed-scroll-root"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain scroll-smooth px-4 pb-10 pt-28 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div className="mx-auto max-w-md snap-start space-y-4 pb-6 pt-10">
          {segmentMessage && <section className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 px-5 py-4 text-sm font-black leading-snug text-cyan-50 shadow-xl">{segmentMessage}</section>}
          {dailyWinner && <DailyWinnerBanner winner={dailyWinner} />}
          {boostEvent && <BoostEventBanner event={boostEvent} />}
          <MiniLeaderboard posts={topRealPosts} />
          <section className="rounded-[30px] border border-yellow-300/30 bg-black/30 p-[2px] shadow-2xl">
            <div className="rounded-[28px] bg-[#050816] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-wide text-yellow-200">🔥 Päivän kierros</p><p className="mt-1 text-3xl font-black">Potti auki</p></div>
                <Link to="/pots" className="rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-black text-black">Tilanne</Link>
              </div>
            </div>
          </section>
        </div>

        {loading ? (
          <section className="mx-auto max-w-md snap-start rounded-[34px] border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
            <p className="font-black text-white/70">AI järjestää feediä...</p>
          </section>
        ) : safePosts.length ? (
          safePosts.map((post, index) => (
            <div key={post.id || index} data-feed-card data-feed-card-index={index} className={`mx-auto flex min-h-[100dvh] max-w-md snap-start items-center py-5 transition-all duration-300 ease-out ${activeIndex === index ? "scale-100 opacity-100" : "scale-[0.965] opacity-60"}`}>
              <div className="relative w-full">
                {!preloaded[post.id] && index > activeIndex && index <= activeIndex + 3 && <div className="absolute right-5 top-5 z-20 rounded-full bg-black/40 px-3 py-1 text-[10px] font-black text-white/50 backdrop-blur-xl">preload...</div>}
                <SafePostCard post={post} index={index} user={user} voted={Boolean(voted[post.id])} rankInfo={calculateRankInfo(safePosts, post.id) || { rank: index + 1 }} onVote={vote} />
              </div>
            </div>
          ))
        ) : (
          <div className="mx-auto flex min-h-[100dvh] max-w-md snap-start items-center py-5"><FallbackCard /></div>
        )}
      </main>

      <BottomNav hidden={uiHidden || dragging} />
    </div>
  );
}
