import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { calculateLivePot, calculateInteractionXp, rankKolehtiFeed } from "../lib/kolehtiEngine";

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
    group_id: post.group_id || null,
    created_at: post.created_at || new Date().toISOString(),
    votes: Number(post.votes || post.vote_count || voteCount || 0),
    vote_count: Number(post.vote_count || post.votes || voteCount || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
    views: Number(post.views || 1),
  };
}

function sanitizePosts(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((post) => normalizePost(post, post?.vote_count || post?.votes || 0))
    .filter(Boolean)
    .filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
}

const starterPosts = [
  normalizePost({ id: "starter-1", content: "Kirjoita oma perustelu ja kerää ääniä.", user_id: "starter", vote_count: 5, ai_score: 70, is_starter: true }),
  normalizePost({ id: "starter-2", content: "Hyvä perustelu on selkeä ja aito.", user_id: "starter", vote_count: 3, ai_score: 65, is_starter: true }),
].filter(Boolean);

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-3xl border border-white/10 bg-slate-950/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-black">
        <Link to="/">Koti</Link>
        <Link to="/feed" className="text-cyan-300">Feed</Link>
        <Link to="/new" className="rounded-2xl bg-blue-500 px-2 py-3 text-white">Uusi</Link>
        <Link to="/pots">Potit</Link>
        <Link to="/profile">Profiili</Link>
      </div>
    </nav>
  );
}

function PostCard({ post, index, voted, onVote }) {
  const safePost = normalizePost(post);
  if (!safePost) return null;
  const votes = Number(safePost.vote_count || safePost.votes || 0);
  const score = Number(safePost.kolehti_score || safePost.ai_score || 0);

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-500/20 text-xl font-black text-cyan-200">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Perustelu</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-lg font-black leading-snug text-white">{safePost.content}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black">
        <div className="rounded-2xl bg-black/25 p-3">
          <div className="text-white/45">Äänet</div>
          <div className="mt-1 text-xl text-white">{votes}</div>
        </div>
        <div className="rounded-2xl bg-black/25 p-3">
          <div className="text-white/45">Score</div>
          <div className="mt-1 text-xl text-cyan-200">{Math.round(score)}</div>
        </div>
        <div className="rounded-2xl bg-black/25 p-3">
          <div className="text-white/45">Tila</div>
          <div className="mt-1 text-xl">{safePost.is_starter ? "AI" : "Live"}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onVote(safePost)}
        disabled={Boolean(voted) || Boolean(safePost.is_starter)}
        className="mt-5 w-full rounded-2xl bg-cyan-500 px-5 py-4 text-lg font-black text-white shadow-xl shadow-cyan-500/20 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
      >
        {safePost.is_starter ? "Luo oma perustelu" : voted ? "Äänestetty" : "Tykkää + XP"}
      </button>
    </article>
  );
}

export default function FeedPageStable() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [voted, setVoted] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const safePosts = useMemo(() => {
    const real = sanitizePosts(posts);
    return real.length ? real : starterPosts;
  }, [posts]);

  const activePlayers = Math.max(1, safePosts.filter((p) => !p.is_starter).length * 120);
  const livePot = calculateLivePot({ activePlayers, invitedPlayers: 25 });
  const likeXp = calculateInteractionXp({ action: "like", strongLikesUsed: 2, groupSize: activePlayers });

  useEffect(() => {
    loadFeed();
    const channel = supabase
      .channel("safe-feed-no-card")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadFeed)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, loadFeed)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function loadFeed() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;
      setUser(currentUser);

      const { data: postsData, error: postsError } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(80);
      const { data: votesData, error: votesError } = await supabase.from("votes").select("post_id,user_id,value,group_id");
      if (postsError || votesError) throw postsError || votesError;

      const voteCounts = {};
      const votedMap = {};
      (votesData || []).forEach((vote) => {
        if (!vote?.post_id) return;
        voteCounts[vote.post_id] = (voteCounts[vote.post_id] || 0) + Number(vote.value || 1);
        if (vote.user_id === currentUser?.id) votedMap[vote.post_id] = true;
      });

      const prepared = sanitizePosts(postsData).map((post) => normalizePost(post, voteCounts[post.id] || 0)).filter(Boolean);
      setPosts(rankKolehtiFeed(prepared, { sameGroup: true }));
      setVoted(votedMap);
    } catch (error) {
      console.warn("Feed load fallback", error);
      setToast(error?.message || "Feedin lataus epäonnistui");
      setPosts(starterPosts);
    } finally {
      setLoading(false);
    }
  }

  async function vote(post) {
    const safePost = normalizePost(post);
    if (!safePost || safePost.is_starter) {
      setToast("Luo oma perustelu ja kilpaile oikeasti.");
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
    setToast(`Ääni annettu. +${likeXp.xp} XP`);
    setTimeout(() => setToast(""), 2200);
    await loadFeed();
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 px-4 pb-32 pt-5 text-white">
      {toast && <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-2xl bg-cyan-500/20 px-5 py-3 text-sm font-black text-cyan-100 backdrop-blur-xl">{toast}</div>}
      <header className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">KOLEHTI</h1>
            <p className="text-xs font-bold text-white/50">Safe Engine Feed</p>
          </div>
          <Link to="/new" className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-black">Uusi</Link>
        </div>
      </header>
      <main className="mx-auto mt-5 max-w-md space-y-5">
        <section className="rounded-3xl border border-yellow-300/20 bg-white/10 p-5">
          <p className="text-xs font-black uppercase text-yellow-200">Päivän kierros</p>
          <p className="mt-1 text-3xl font-black">{livePot.amount} euroa</p>
          <p className="mt-1 text-xs font-bold text-white/60">{Math.round(livePot.fillRate)}% täynnä, {livePot.missingPlayers} paikkaa jäljellä</p>
          <p className="mt-1 text-xs font-bold text-cyan-200">Strong liket: {likeXp.strongLikesLeft}</p>
        </section>
        {loading ? <p className="rounded-3xl bg-white/10 p-5 font-black">Feed latautuu...</p> : safePosts.map((post, index) => (
          <PostCard key={post.id || index} post={post} index={index} voted={Boolean(voted[post.id])} onVote={vote} />
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
