import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import ForYouCard from "../components/ForYouCard";
import { calculateRankInfo } from "../lib/almostWin";

const FEED_VERSION = "FEED CLEAN 2026-04-28";

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
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadFeed();

    const channel = supabase
      .channel("kolehti-clean-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, loadFeed)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadFeed() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user || null;
    setUser(currentUser);

    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    if (postsError) {
      setToast(postsError.message || "Feedin lataus epäonnistui");
      setPosts([]);
      setLoading(false);
      return;
    }

    const { data: votesData } = await supabase.from("votes").select("post_id,user_id");
    const voteCounts = {};
    const votedMap = {};

    (votesData || []).forEach((vote) => {
      voteCounts[vote.post_id] = (voteCounts[vote.post_id] || 0) + 1;
      if (vote.user_id === currentUser?.id) votedMap[vote.post_id] = true;
    });

    const prepared = (postsData || [])
      .map((post) => ({
        ...post,
        vote_count: voteCounts[post.id] || Number(post.votes || 0),
        growth_score: Number(post.growth_score || post.ai_score || 0),
      }))
      .sort((a, b) => {
        const scoreA = Number(a.vote_count || 0) * 10 + Number(a.growth_score || 0);
        const scoreB = Number(b.vote_count || 0) * 10 + Number(b.growth_score || 0);
        return scoreB - scoreA;
      });

    setPosts(prepared);
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

    const { error } = await supabase.from("votes").insert({ post_id: post.id, user_id: user.id, value: 1 });

    if (error) {
      setToast(error.message || "Äänestys epäonnistui");
      setTimeout(() => setToast(""), 1800);
      return;
    }

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

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">KOLEHTI</h1>
            <p className="text-xs font-black uppercase text-white/50">Feed · yksi kilpailu</p>
          </div>
          <Link to="/new" className="rounded-3xl bg-cyan-500 px-5 py-4 text-base font-black shadow-xl shadow-cyan-500/25">Uusi</Link>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-3 text-xs font-black text-cyan-100">
          {FEED_VERSION}
        </section>

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
            <p className="font-black text-white/70">Ladataan feediä...</p>
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
