import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

import { rankForYou } from "../lib/tiktokAI";
import { getSmartFeed } from "../lib/smartFeed";
import { updateStreak } from "../lib/streak";
import { createNotification } from "../lib/notifications";
import { trackRetentionEvent } from "../lib/retention";
import { rewardVote, rewardTopRank } from "../lib/progression";
import {
  calculateRankInfo,
  updatePostRankStats,
  notifyAlmostWin,
} from "../lib/almostWin";
import { getTodayWinner } from "../lib/dailyWinner";
import {
  cleanupExpiredBoostEvents,
  createRandomBoostEvent,
  getActiveBoostEvent,
} from "../lib/boostEvents";
import { runViralLoopV3 } from "../lib/viralLoop";
import {
  optimizeFeedForGrowthAsync,
  trackTopGrowthImpressions,
} from "../lib/aiGrowthOptimizer";
import { getUserSegment } from "../lib/userSegment";
import { sendSegmentMessage } from "../lib/segmentMessages";

import ForYouCard from "../components/ForYouCard";
import ComebackBanner from "../components/ComebackBanner";
import JackpotBanner from "../components/JackpotBanner";
import LiveLeaderboard from "../components/LiveLeaderboard";
import DailyWinnerBanner from "../components/DailyWinnerBanner";
import WinnerCountdown from "../components/WinnerCountdown";
import BoostEventBanner from "../components/BoostEventBanner";
import WinnerHypeModal from "../components/WinnerHypeModal";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [voted, setVoted] = useState({});
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dailyWinner, setDailyWinner] = useState(null);
  const [winnerPopup, setWinnerPopup] = useState(null);
  const [boostEvent, setBoostEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadFeed();

    const channel = supabase
      .channel("kolehti-countdown-boost-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "boost_events" }, loadFeed)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadFeed() {
    setLoading(true);
    await cleanupExpiredBoostEvents();

    const { data: { user } } = await supabase.auth.getUser();
    setUser(user || null);

    let profileData = null;
    if (user) {
      profileData = await updateStreak(user, supabase);
      setProfile(profileData || null);
      await trackRetentionEvent(user.id, "feed_open");
    }

    const groupId = localStorage.getItem("kolehti_group_id");

    let postsQuery = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(120);
    let votesQuery = supabase.from("votes").select("*");
    let eventsQuery = supabase.from("user_events").select("*").limit(300);

    if (groupId) {
      postsQuery = postsQuery.eq("group_id", groupId);
      votesQuery = votesQuery.eq("group_id", groupId);
    }
    if (user) eventsQuery = eventsQuery.eq("user_id", user.id);

    const { data: postsData, error: postsError } = await postsQuery;
    const { data: votesData, error: votesError } = await votesQuery;
    const { data: eventsData } = await eventsQuery;

    if (postsError || votesError) {
      setToast(postsError?.message || votesError?.message || "Virhe ladatessa.");
      setLoading(false);
      return;
    }

    const voteCounts = {};
    const votedMap = {};

    (votesData || []).forEach((vote) => {
      voteCounts[vote.post_id] = (voteCounts[vote.post_id] || 0) + 1;
      if (vote.user_id === user?.id) votedMap[vote.post_id] = true;
    });

    const prepared = (postsData || []).map((post) => {
      const voteCount = voteCounts[post.id] || Number(post.votes || 0);
      const boostMultiplier = Number(post.boost_multiplier || 1);
      return {
        ...post,
        vote_count: voteCount,
        boost_score: Number(post.boost_score || 0) + (post.boost_event_active ? 40 * boostMultiplier : 0),
      };
    });

    const ranked = rankForYou(prepared, eventsData || []);
    const smartFeed = getSmartFeed(ranked);
    const optimizedFeed = await optimizeFeedForGrowthAsync(smartFeed, {
      userId: user?.id,
      voted: votedMap,
      groupId,
      profile: profileData,
    });

    if (user) await trackTopGrowthImpressions(user.id, optimizedFeed);

    for (let i = 0; i < optimizedFeed.length; i++) {
      await updatePostRankStats(optimizedFeed[i], i + 1);
    }

    setPosts(optimizedFeed);
    setVoted(votedMap);

    const winner = await getTodayWinner();
    setDailyWinner(winner || null);

    setLoading(false);
  }

  async function vote(post) {
    if (!user) return;

    await supabase.from("votes").insert({
      post_id: post.id,
      user_id: user.id,
    });

    navigator.vibrate?.([20, 40, 20]);
    setToast("🔥 Ääni annettu! +5 XP");
    setTimeout(() => setToast(""), 1500);

    await loadFeed();
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/85 px-4 py-4 backdrop-blur-xl">
        <h1 className="text-3xl font-black">KOLEHTI</h1>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 py-5 pb-28">

        <div className="sticky top-[70px] z-30">
          <div className="rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 p-[2px]">
            <div className="flex justify-between rounded-2xl bg-[#050816] px-4 py-3">
              <div>
                <p className="text-xs">🔥 Potti käynnissä</p>
                <p className="font-black">1000 €</p>
              </div>
              <p className="text-cyan-300 font-black">02:14:33</p>
            </div>
          </div>
        </div>

        {posts.map((post, index) => (
          <ForYouCard key={post.id} post={post} index={index} user={user} voted={voted[post.id]} rankInfo={calculateRankInfo(posts, post.id)} onVote={vote} />
        ))}

      </main>

    </div>
  );
}
