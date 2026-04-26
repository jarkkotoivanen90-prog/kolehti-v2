import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { rankForYou } from "../lib/tiktokAI";
import { updateStreak } from "../lib/streak";
import { createNotification } from "../lib/notifications";
import { trackRetentionEvent } from "../lib/retention";
import ForYouCard from "../components/ForYouCard";
import ComebackBanner from "../components/ComebackBanner";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [voted, setVoted] = useState({});
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState("foryou");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadFeed();

    const channel = supabase
      .channel("kolehti-retention-feed")
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

    setPosts(rankForYou(prepared, eventsData || []));
    setVoted(votedMap);
    setLoading(false);
  }

  async function vote(post) {
    if (!user) {
      setToast("Kirjaudu ensin.");
      setTimeout(() => setToast(""), 2000);
      return;
    }

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

    await trackRetentionEvent(user.id, "vote", { post_id: post.id });

    if (post.user_id && post.user_id !== user.id) {
      await createNotification({
        userId: post.user_id,
        type: "vote",
        title: "Sait uuden äänen 💗",
        body: "Perustelusi sai uuden äänen ja voi nousta rankingissa.",
      });
    }

    navigator.vibrate?.(45);
    setToast("💗 Ääni annettu");
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
              {profile ? `🔥 ${profile.user_streak || 1} päivän streak` : "For You"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/new"
              className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black"
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

        <div className="mx-auto mt-4 flex max-w-md gap-2 overflow-x-auto">
          <Filter active={mode === "foryou"} onClick={() => changeMode("foryou")}>
            🔥 For You
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

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            Ladataan...
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-center">
            <div className="text-6xl">✨</div>
            <h2 className="mt-4 text-2xl font-black">Ei lisää perusteluja</h2>
            <p className="mt-2 text-sm text-white/55">
              Luo oma perustelu tai vaihda näkymää.
            </p>
            <Link
              to="/new"
              className="mt-5 block rounded-2xl bg-cyan-500 px-5 py-4 font-black"
            >
              Luo uusi
            </Link>
          </div>
        ) : (
          visiblePosts.map((post, index) => (
            <ForYouCard
              key={post.id}
              post={post}
              index={index}
              user={user}
              voted={voted[post.id]}
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
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
        active
          ? "bg-white text-black"
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
        <Link to="/">🏠<div>Koti</div></Link>
        <Link to="/feed" className="text-cyan-300">🔥<div>Feed</div></Link>
        <Link to="/new" className="-mt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">
            +
          </div>
          <div>Uusi</div>
        </Link>
        <Link to="/vote">💗<div>Äänestä</div></Link>
        <Link to="/profile">👤<div>Profiili</div></Link>
      </div>
    </nav>
  );
}
