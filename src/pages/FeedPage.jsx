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

const FEED_VERSION = "TIKTOK FEED ENGINE 2026-04-28";

const starterPosts = [
  {
    id: "starter-1",
    content:
      "Kun yksi ihminen saa apua oikealla hetkellä, koko porukka vahvistuu. Siksi tämän pelin pitäisi nostaa esiin ne perustelut, jotka koskettavat aidosti.",
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
    content:
      "Hyvä perustelu ei ole pisin teksti. Se on sellainen, jonka jälkeen toinen pelaaja ajattelee: tämän minä ymmärrän ja tätä haluan tukea.",
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
    content:
      "Porukan voima syntyy siitä, että ääni ei mene vain äänekkäimmälle vaan sille, joka saa muut mukaan. Siksi jokainen perustelu voi muuttaa pelin suunnan.",
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
  {
    id: "starter-4",
    content:
      "Tänään voittaja voi olla kuka tahansa. Yksi selkeä ajatus, yksi hyvä perustelu ja muutama ääni voi nostaa uuden nimen kärkeen.",
    user_id: "starter-ai",
    group_id: null,
    votes: 5,
    vote_count: 5,
    growth_score: 70,
    boost_score: 6,
    ai_score: 75,
    is_starter: true,
    created_at: new Date(Date.now() - 1000 * 60 * 64).toISOString(),
  },
];

function buildAlwaysAliveFeed(realPosts) {
  const real = Array.isArray(realPosts) ? realPosts : [];
  const needed = Math.max(0, 6 - real.length);
  return [...real, ...starterPosts.slice(0, needed)];
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[30px] border border-white/10 bg-[#061126]/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-black">
        <Link to="/">🏠<div>Koti</div></Link>
        <Link to="/feed" className="text-cyan-300">🔥<div>Feed</div></Link>
        <Link to="/new" className="-mt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">+</div>
          <div>Uusi</div>
        </Link>
        <Link to="/pots">🏆<div>Potit</div></Link>
        <Link to="/profile">👤<div>Profiili</div></Link>
      </div>
    </nav>
  );
}

function MiniLeaderboard({ posts }) {
  const topPosts = posts.filter((p) => !p.is_starter).slice(0, 3);
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

function FeedProgress({ activeIndex, total, onJump }) {
  if (!total) return null;

  return (
    <div className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2">
      {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
        <button
          key={i}
          onClick={() => onJump(i)}
          className={`h-2 rounded-full transition-all ${activeIndex === i ? "w-5 bg-cyan-300" : "w-2 bg-white/25"}`}
          aria-label={`Siirry korttiin ${i + 1}`}
        />
      ))}
    </div>
  );
}

export default function FeedPage() {
  const scrollerRef = useRef(null);
  const activeStartedAtRef = useRef(Date.now());
  const activeTrackedRef = useRef({});

  const [posts, setPosts] = useState([]);
  const [voted, setVoted] = useState({});
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dailyWinner, setDailyWinner] = useState(null);
  const [winnerPopup, setWinnerPopup] = useState(null);
  const [boostEvent, setBoostEvent] = useState(null);
  const [segmentMessage, setSegmentMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedHeaderHidden, setFeedHeaderHidden] = useState(false);

  const topRealPosts = useMemo(() => posts.filter((p) => !p.is_starter), [posts]);

  useEffect(() => {
    loadFeed();

    const channel = supabase
      .channel("kolehti-tiktok-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "boost_events" }, loadFeed)
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
      let bestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        const cardMiddle = card.offsetTop + card.offsetHeight / 2;
        const distance = Math.abs(cardMiddle - viewportMiddle);
        if (distance < bestDistance) {
          bestDistance = distance;
          nextIndex = index;
        }
      });

      const goingDown = scroller.scrollTop > lastTop;
      setFeedHeaderHidden(goingDown && scroller.scrollTop > 120);
      lastTop = Math.max(0, scroller.scrollTop);

      setActiveIndex((prev) => {
        if (prev !== nextIndex) {
          activeStartedAtRef.current = Date.now();
          const activePost = posts[nextIndex];
          if (activePost && !activePost.is_starter && !activeTrackedRef.current[activePost.id]) {
            activeTrackedRef.current[activePost.id] = true;
            safeCall(() => supabase.from("user_events").insert({
              user_id: user?.id || null,
              post_id: activePost.id,
              event_type: "tiktok_card_focus",
              source: "feed",
              meta: { index: nextIndex, engine: FEED_VERSION },
            }));
          }
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

    return () => scroller.removeEventListener("scroll", onScroll);
  }, [posts, user?.id, activeIndex]);

  useEffect(() => {
    const activePost = posts[activeIndex];
    if (!activePost || activePost.is_starter) return;

    const timer = setTimeout(() => {
      safeCall(() => supabase.from("user_events").insert({
        user_id: user?.id || null,
        post_id: activePost.id,
        event_type: "tiktok_deep_watch",
        source: "feed",
        meta: { duration_ms: Date.now() - activeStartedAtRef.current, index: activeIndex },
      }));
    }, 3200);

    return () => clearTimeout(timer);
  }, [activeIndex, posts, user?.id]);

  async function safeCall(fn, fallback = null) {
    try {
      return await fn();
    } catch (error) {
      console.warn("Engine safe fallback:", error);
      return fallback;
    }
  }

  function jumpToCard(index) {
    const scroller = scrollerRef.current;
    const card = scroller?.querySelector(`[data-feed-card-index="${index}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleInvite() {
    if (!user?.id) {
      setToast("Kirjaudu sisään ja saat oman kutsulinkin.");
      setTimeout(() => setToast(""), 1800);
      return;
    }

    const link = getReferralLink(user.id);
    await navigator.clipboard.writeText(link);
    await safeCall(() => supabase.from("user_events").insert({
      user_id: user.id,
      event_type: "invite_link_copied",
      source: "feed",
      meta: { link_copied: true },
    }));

    navigator.vibrate?.(25);
    setToast("🔥 Kutsu linkki kopioitu! Kaverit mukaan → näkyvyys kasvaa.");
    setTimeout(() => setToast(""), 2400);
  }

  async function loadFeed() {
    setLoading(true);
    await safeCall(() => cleanupExpiredBoostEvents());
    await safeCall(() => createRandomBoostEvent());

    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user || null;
    setUser(currentUser);

    let profileData = null;
    if (currentUser) {
      profileData = await safeCall(() => updateStreak(currentUser, supabase), null);
      setProfile(profileData || null);
      await safeCall(() => trackRetentionEvent(currentUser.id, "feed_open"));
      const segment = await safeCall(() => getUserSegment(currentUser.id), null);
      const message = await safeCall(() => sendSegmentMessage(segment), null);
      setSegmentMessage(message || null);
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
      voteCounts[vote.post_id] = (voteCounts[vote.post_id] || 0) + Number(vote.value || 1);
      if (vote.user_id === currentUser?.id) votedMap[vote.post_id] = true;
    });

    const prepared = (postsData || []).map((post) => {
      const voteCount = voteCounts[post.id] || Number(post.votes || 0);
      const boostMultiplier = Number(post.boost_multiplier || 1);
      return {
        ...post,
        vote_count: voteCount,
        boost_score: Number(post.boost_score || 0) + (post.boost_event_active ? 40 * boostMultiplier : 0),
        growth_score: Number(post.growth_score || post.ai_score || 0),
      };
    });

    let optimizedFeed = [];
    try {
      const ranked = rankForYou(prepared, eventsData || []);
      const smartFeed = getSmartFeed(ranked);
      optimizedFeed = await optimizeFeedForGrowthAsync(smartFeed, {
        userId: currentUser?.id,
        voted: votedMap,
        groupId,
        profile: profileData,
      });
    } catch (error) {
      console.warn("AI engine fallback used:", error);
      optimizedFeed = prepared.sort((a, b) => {
        const scoreA = Number(a.vote_count || 0) * 10 + Number(a.growth_score || 0) + Number(a.boost_score || 0);
        const scoreB = Number(b.vote_count || 0) * 10 + Number(b.growth_score || 0) + Number(b.boost_score || 0);
        return scoreB - scoreA;
      });
    }

    optimizedFeed = buildAlwaysAliveFeed(optimizedFeed);

    if (currentUser) {
      await safeCall(() => trackTopGrowthImpressions(currentUser.id, optimizedFeed.filter((p) => !p.is_starter)));
      await safeCall(() => runViralLoopV3({ userId: currentUser.id, posts: optimizedFeed.filter((p) => !p.is_starter), profile: profileData }));
    }

    for (let i = 0; i < optimizedFeed.length; i++) {
      if (!optimizedFeed[i].is_starter) {
        await safeCall(() => updatePostRankStats(optimizedFeed[i], i + 1));
        if (currentUser && i < 3) await safeCall(() => rewardTopRank(currentUser.id, i + 1));
      }
    }

    setBoostEvent(await safeCall(() => getActiveBoostEvent(), null));
    setDailyWinner(await safeCall(() => getTodayWinner(), null));

    const { data: latestWinner } = currentUser
      ? await supabase
          .from("competition_winners")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };
    if (latestWinner) setWinnerPopup(latestWinner);

    setPosts(optimizedFeed);
    setVoted(votedMap);
    setLoading(false);
  }

  async function vote(post) {
    if (post.is_starter) {
      setToast("✨ Malliperustelu. Luo oma ja kilpaile oikeasti.");
      setTimeout(() => setToast(""), 1800);
      return;
    }
    if (!user) {
      setToast("Kirjaudu ensin sisään.");
      setTimeout(() => setToast(""), 1600);
      return;
    }
    if (voted[post.id]) {
      setToast("Olet jo äänestänyt tämän.");
      setTimeout(() => setToast(""), 1600);
      return;
    }

    const { error } = await supabase.from("votes").insert({
      post_id: post.id,
      user_id: user.id,
      group_id: post.group_id || null,
      value: 1,
    });
    if (error) {
      setToast(error.message || "Äänestys epäonnistui");
      setTimeout(() => setToast(""), 1800);
      return;
    }

    await safeCall(() => rewardVote(user.id));
    await safeCall(() => notifyAlmostWin({ userId: post.user_id, post }));
    await safeCall(() => supabase.from("user_events").insert({
      user_id: user.id,
      post_id: post.id,
      event_type: "vote_growth_trigger",
      source: "feed",
      meta: { boost_signal: true },
    }));

    navigator.vibrate?.([20, 40, 20]);
    setToast("🔥 Ääni annettu! +5 XP");
    setTimeout(() => setToast("🚀 Näkyvyys nousussa"), 1100);
    if (Math.random() > 0.7) setTimeout(() => setToast("👀 Uusia katsojia tuli"), 1800);
    setTimeout(() => setToast(""), 3000);
    await loadFeed();
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_42%,#02030a_100%)]" />

      {toast && (
        <div className="fixed left-1/2 top-5 z-[999] -translate-x-1/2 rounded-2xl border border-cyan-300/30 bg-cyan-500/20 px-5 py-3 text-sm font-black text-cyan-100 shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      )}
      {winnerPopup && <WinnerHypeModal winner={winnerPopup} onClose={() => setWinnerPopup(null)} />}

      <header className={`fixed left-0 right-0 top-[60px] z-40 border-b border-white/10 bg-[#050816]/85 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-xl transition-transform duration-300 ${feedHeaderHidden ? "-translate-y-[86%]" : "translate-y-0"}`}>
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight">KOLEHTI</h1>
            <p className="text-[10px] font-black uppercase text-white/50">{FEED_VERSION}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleInvite} className="rounded-2xl bg-green-500 px-3 py-3 text-xs font-black text-white shadow-xl shadow-green-500/20">
              Kutsu +Boost
            </button>
            <Link to="/new" className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black shadow-xl shadow-cyan-500/25">
              Uusi
            </Link>
          </div>
        </div>
      </header>

      <FeedProgress activeIndex={activeIndex} total={posts.length} onJump={jumpToCard} />

      <main
        ref={scrollerRef}
        id="feed-scroll-root"
        className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll scroll-smooth px-4 pb-28 pt-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="mx-auto max-w-md snap-start space-y-4 pb-6 pt-10">
          {segmentMessage && (
            <section className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 px-5 py-4 text-sm font-black leading-snug text-cyan-50 shadow-xl">
              {segmentMessage}
            </section>
          )}
          {dailyWinner && <DailyWinnerBanner winner={dailyWinner} />}
          {boostEvent && <BoostEventBanner event={boostEvent} />}
          <MiniLeaderboard posts={topRealPosts} />
          <section className="rounded-[30px] border border-yellow-300/30 bg-black/30 p-[2px] shadow-2xl">
            <div className="rounded-[28px] bg-[#050816] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-yellow-200">🔥 Päivän kierros</p>
                  <p className="mt-1 text-3xl font-black">Potti auki</p>
                </div>
                <Link to="/pots" className="rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-black text-black">
                  Tilanne
                </Link>
              </div>
            </div>
          </section>
        </div>

        {loading ? (
          <section className="mx-auto max-w-md snap-start rounded-[34px] border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
            <p className="font-black text-white/70">AI järjestää feediä...</p>
          </section>
        ) : (
          posts.map((post, index) => (
            <div
              key={post.id}
              data-feed-card
              data-feed-card-index={index}
              className="mx-auto flex min-h-[100dvh] max-w-md snap-start items-center py-5"
            >
              <ForYouCard
                post={post}
                index={index}
                user={user}
                voted={voted[post.id]}
                rankInfo={calculateRankInfo(posts, post.id)}
                onVote={vote}
              />
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
