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
import { getTodayWinner, pickDailyWinner } from "../lib/dailyWinner";

import ForYouCard from "../components/ForYouCard";
import ComebackBanner from "../components/ComebackBanner";
import JackpotBanner from "../components/JackpotBanner";
import LiveLeaderboard from "../components/LiveLeaderboard";
import DailyWinnerBanner from "../components/DailyWinnerBanner";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [voted, setVoted] = useState({});
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dailyWinner, setDailyWinner] = useState(null);
  const [mode, setMode] = useState("foryou");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadFeed();

    const channel = supabase
      .channel("kolehti-daily-winner-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        loadFeed
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        loadFeed
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadFeed() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user || null);

    if (user) {
      const profileData = await updateStreak(user, supabase);
      setProfile(profileData || null);
      await trackRetentionEvent(user.id, "feed_open");
    }

    const groupId = localStorage.getItem("kolehti_group_id");

    let postsQuery = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(120);

    let votesQuery = supabase.from("votes").select("*");
    let eventsQuery = supabase.from("user_events").select("*").limit(300);

    if (groupId) {
      postsQuery = postsQuery.eq("group_id", groupId);
      votesQuery = votesQuery.eq("group_id", groupId);
    }

    if (user) {
      eventsQuery = eventsQuery.eq("user_id", user.id);
    }

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

      if (vote.user_id === user?.id) {
        votedMap[vote.post_id] = true;
      }
    });

    const prepared = (postsData || []).map((post) => ({
      ...post,
      vote_count: voteCounts[post.id] || 0,
    }));

    const ranked = rankForYou(prepared, eventsData || []);
    const smartFeed = getSmartFeed(ranked);

    for (let i = 0; i < smartFeed.length; i++) {
      await updatePostRankStats(smartFeed[i], i + 1);
    }

    setPosts(smartFeed);
    setVoted(votedMap);

    const winner = await getTodayWinner();

    if (winner) {
      setDailyWinner(winner);
    } else {
      const newWinner = await pickDailyWinner();

      if (newWinner) {
        setDailyWinner({
          posts: newWinner,
        });
      }
    }

    setLoading(false);
  }

  async function vote(post) {
    if (!user) {
      setToast("Kirjaudu ensin.");
      setTimeout(() => setToast(""), 2000);
      return;
    }

    const rankInfoBeforeVote = calculateRankInfo(posts, post.id);
    const groupId = localStorage.getItem("kolehti_group_id");

    const { error } = await supabase.from("votes").insert({
      post_id: post.id,
      user_id: user.id,
      group_id: groupId || post.group_id || null,
      value: 1,
    });

    if (error) {
      setToast("Olet jo äänestänyt tämän.");
      setTimeout(() => setToast(""), 2000);
      return;
    }

    const newVoteCount = Number(post.votes || post.vote_count || 0) + 1;

    await rewardVote(user.id);

    await supabase
      .from("posts")
      .update({
        votes: newVoteCount,
        boost_score: Number(post.boost_score || 0) + 5,
        last_engaged_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    if (post.user_id) {
      await rewardTopRank(post.user_id, post.last_rank || rankInfoBeforeVote?.rank);

      await supabase
        .from("profiles")
        .update({
          leaderboard_points: newVoteCount,
          leaderboard_best_rank: post.last_rank || null,
        })
        .eq("id", post.user_id);
    }

    await trackRetentionEvent(user.id, "vote", { post_id: post.id });

    await notifyAlmostWin({
      post,
      rankInfo: rankInfoBeforeVote,
      userId: user.id,
    });

    if (post.user_id && post.user_id !== user.id) {
      await createNotification({
        userId: post.user_id,
        type: "vote",
        title: "Sait uuden äänen 💗",
        body: "Perustelusi sai uuden äänen ja voi nousta rankingissa.",
      });
    }

    navigator.vibrate?.(45);
    setToast("💗 +5 XP · Ääni annettu");
    setTimeout(() => setToast(""), 1600);

    await loadFeed();
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    trackRetentionEvent(user?.id, `filter_${nextMode}`);
  }

  const visiblePosts = useMemo(() => {
    if (mode === "unvoted") return posts.filter((p) => !voted[p.id]);

    if (mode === "new") {
      return [...posts].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }

    if (mode === "ai") {
      return [...posts].sort(
        (a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0)
      );
    }

    if (mode === "rising") {
      return posts.filter((p) => {
        const votes = Number(p.vote_count || p.votes || 0);
        const aiScore = Number(p.ai_score || 0);
        return (
          votes >= 3 ||
          aiScore >= 70 ||
          p.status_label?.includes("Nousemassa") ||
          p.status_label?.includes("TOP")
        );
      });
    }

    return posts;
  }, [posts, voted, mode]);

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      {toast && (
        <div className="fixed left-1/2 top-5 z-[999] -translate-x-1/2 rounded-2xl border border-cyan-300/30 bg-cyan-500/20 px-5 py-3 text-sm font-black text-cyan-100 shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/85 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">KOLEHTI</h1>
            <p className="text-xs font-bold text-white/50">
              {profile
                ? `LVL ${profile.level || 1} · 🔥 ${profile.user_streak || 1} päivän streak`
                : "For You"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/new"
              className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black shadow-lg shadow-cyan-500/20"
            >
              Uusi
            </Link>

            <Link
              to="/profile"
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black"
            >
              Profiili
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-md gap-2 overflow-x-auto pb-1">
          <Filter active={mode === "foryou"} onClick={() => changeMode("foryou")}>
            🔥 For You
          </Filter>

          <Filter active={mode === "rising"} onClick={() => changeMode("rising")}>
            🚀 Nousevat
          </Filter>

          <Filter active={mode === "unvoted"} onClick={() => changeMode("unvoted")}>
            💗 Äänestämättä
          </Filter>

          <Filter active={mode === "ai"} onClick={() => changeMode("ai")}>
            🤖 AI
          </Filter>

          <Filter active={mode === "new"} onClick={() => changeMode("new")}>
            🆕 Uusimmat
          </Filter>
        </div>
      </header>

      <main className="mx-auto max-w-md snap-y snap-mandatory space-y-5 overflow-y-auto px-4 py-5 pb-28">
        <ComebackBanner />

        <DailyWinnerBanner winner={dailyWinner} />

        <JackpotBanner topPost={posts[0]} />

        <LiveLeaderboard posts={posts} />

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
            <p className="font-black text-white/70">Ladataan feediä...</p>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
            <div className="text-6xl">✨</div>
            <h2 className="mt-4 text-2xl font-black">Ei lisää perusteluja</h2>
            <p className="mt-2 text-sm font-bold text-white/55">
              Luo oma perustelu tai vaihda näkymää.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link
                to="/new"
                className="rounded-2xl bg-cyan-500 px-5 py-4 font-black"
              >
                Luo uusi
              </Link>

              <button
                onClick={() => changeMode("foryou")}
                className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-black"
              >
                For You
              </button>
            </div>
          </div>
        ) : (
          visiblePosts.map((post, index) => (
            <ForYouCard
              key={post.id}
              post={post}
              index={index}
              user={user}
              voted={voted[post.id]}
              rankInfo={calculateRankInfo(posts, post.id)}
              onVote={vote}
            />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function Filter({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition active:scale-95 ${
        active
          ? "bg-white text-black shadow-xl shadow-white/10"
          : "border border-white/10 bg-white/10 text-white/70"
      }`}
    >
      {children}
    </button>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[30px] border border-white/10 bg-[#061126]/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-black">
        <Link to="/">
          🏠
          <div>Koti</div>
        </Link>

        <Link to="/feed" className="text-cyan-300">
          🔥
          <div>Feed</div>
        </Link>

        <Link to="/new" className="-mt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">
            +
          </div>
          <div>Uusi</div>
        </Link>

        <Link to="/vote">
          💗
          <div>Äänestä</div>
        </Link>

        <Link to="/profile">
          👤
          <div>Profiili</div>
        </Link>
      </div>
    </nav>
  );
}
