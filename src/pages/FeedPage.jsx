import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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

const FEED_VERSION = "FEED ENGINE RESTORED 2026-04-28";

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

function EmptyFeed() {
  return (
    <section className="rounded-[34px] border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl">
      <div className="text-6xl">✨</div>
      <h2 className="mt-4 text-3xl font-black leading-tight">Ei vielä perusteluja</h2>
      <p className="mt-3 text-sm font-bold leading-snug text-white/60">
        Luo ensimmäinen perustelu ja käynnistä kilpailu. Feed päivittyy heti kun postauksia löytyy.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link to="/new" className="rounded-3xl bg-cyan-500 px-5 py-4 text-lg font-black shadow-xl shadow-cyan-500/25">Luo uusi</Link>
        <Link to="/pots" className="rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-lg font-black">Potit</Link>
      </div>
    </section>
  );
}

export default function FeedPage() {
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

  useEffect(() => {
    loadFeed();

    const channel = supabase
      .channel("kolehti-engine-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "boost_events" }, loadFeed)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function safeCall(fn, fallback = null) {
    try {
      return await fn();
    } catch (error) {
      console.warn("Engine safe fallback:", error);
      return fallback;
    }
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
      setPosts([]);
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
      const boostScore = Number(post.boost_score || 0) + (post.boost_event_active ? 40 * boostMultiplier : 0);

      return {
        ...post,
        vote_count: voteCount,
        boost_score: boostScore,
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

    if (currentUser) {
      await safeCall(() => trackTopGrowthImpressions(currentUser.id, optimizedFeed));
      await safeCall(() => runViralLoopV3({ userId: currentUser.id, posts: optimizedFeed, profile: profileData }));
    }

    for (let i = 0; i < optimizedFeed.length; i++) {
      await safeCall(() => updatePostRankStats(optimizedFeed[i], i + 1));
      if (currentUser && i < 3) await safeCall(() => rewardTopRank(currentUser.id, i + 1));
    }

    const activeBoost = await safeCall(() => getActiveBoostEvent(), null);
    setBoostEvent(activeBoost || null);

    const winner = await safeCall(() => getTodayWinner(), null);
    setDailyWinner(winner || null);

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

    navigator.vibrate?.([20, 40, 20]);
    setToast("🔥 Ääni annettu! +5 XP");
    setTimeout(() => setToast(""), 1500);
    await loadFeed();
  }

  return (
    <div className="min-h-screen bg-[#050816] pb-28 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_42%,#02030a_100%)]" />

      {toast && (
        <div className="fixed left-1/2 top-5 z-[999] -translate-x-1/2 rounded-2xl border border-cyan-300/30 bg-cyan-500/20 px-5 py-3 text-sm font-black text-cyan-100 shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      )}

      {winnerPopup && <WinnerHypeModal winner={winnerPopup} onClose={() => setWinnerPopup(null)} />}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">KOLEHTI</h1>
            <p className="text-xs font-black uppercase text-white/50">AI Feed · Growth engine</p>
          </div>
          <Link to="/new" className="rounded-3xl bg-cyan-500 px-5 py-4 text-base font-black shadow-xl shadow-cyan-500/25">Uusi</Link>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-xs font-black text-cyan-100">
          {FEED_VERSION}
        </section>

        {segmentMessage && (
          <section className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 px-5 py-4 text-sm font-black leading-snug text-cyan-50 shadow-xl">
            {segmentMessage}
          </section>
        )}

        {dailyWinner && <DailyWinnerBanner winner={dailyWinner} />}
        {boostEvent && <BoostEventBanner event={boostEvent} />}

        <section className="rounded-[30px] border border-yellow-300/30 bg-black/30 p-[2px] shadow-2xl">
          <div className="rounded-[28px] bg-[#050816] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-yellow-200">🔥 Päivän kierros</p>
                <p className="mt-1 text-3xl font-black">Potti auki</p>
              </div>
              <Link to="/pots" className="rounded-2xl bg-yellow-300 px-4 py-3 text-sm font-black text-black">Tilanne</Link>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[34px] border border-white/10 bg-white/10 p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
            <p className="font-black text-white/70">AI järjestää feediä...</p>
          </section>
        ) : posts.length === 0 ? (
          <EmptyFeed />
        ) : (
          posts.map((post, index) => (
            <ForYouCard key={post.id} post={post} index={index} user={user} voted={voted[post.id]} rankInfo={calculateRankInfo(posts, post.id)} onVote={vote} />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
