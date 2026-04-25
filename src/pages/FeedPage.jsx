import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();

    const channel = supabase
      .channel("live-ranking")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => init()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => init()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: votesData, error: votesError } = await supabase
      .from("votes")
      .select("*");

    if (postsError) alert(postsError.message);
    if (votesError) alert(votesError.message);

    const safePosts = postsData || [];
    const safeVotes = votesData || [];

    setVotes(safeVotes);
    setPosts(rankPosts(safePosts, safeVotes));
    setLoading(false);
  }

  function rankPosts(postsList, votesList) {
    const counts = {};

    votesList.forEach((vote) => {
      counts[vote.post_id] = (counts[vote.post_id] || 0) + 1;
    });

    return postsList
      .map((post) => ({
        ...post,
        vote_count: counts[post.id] || 0,
      }))
      .sort((a, b) => {
        if (b.vote_count !== a.vote_count) {
          return b.vote_count - a.vote_count;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }

  function hasVoted(postId) {
    if (!user) return false;

    return votes.some(
      (vote) => vote.post_id === postId && vote.user_id === user.id
    );
  }

  async function voteForPost(post) {
    if (!user) {
      alert("Kirjaudu ensin.");
      return;
    }

    if (hasVoted(post.id)) {
      alert("Olet jo äänestänyt tätä perustelua.");
      return;
    }

    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      post_id: post.id,
    });

    if (error) {
      if (error.code === "23505") {
        alert("Olet jo äänestänyt tätä perustelua.");
      } else {
        alert(error.message);
      }
      return;
    }

    await init();
  }

  function rankLabel(index) {
    if (index === 0) return "🏆 Päivän kärki";
    if (index === 1) return "🥈 Hopeasija";
    if (index === 2) return "🥉 Pronssisija";
    return `#${index + 1}`;
  }

  function cardStyle(index) {
    if (index === 0) {
      return "border-yellow-300/40 bg-yellow-300/10 shadow-yellow-300/20";
    }

    if (index === 1) {
      return "border-slate-200/30 bg-white/10";
    }

    if (index === 2) {
      return "border-orange-300/30 bg-orange-300/10";
    }

    return "border-white/10 bg-white/10";
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-white">
        Ladataan rankingia...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 text-white">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Ranking Feed</h1>
          <p className="mt-1 text-sm text-white/60">
            Live-ranking päivittyy automaattisesti, kun ääniä annetaan.
          </p>
        </div>

        <button
          onClick={init}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
        >
          Päivitä
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
          Ei vielä postauksia.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => {
            const voted = hasVoted(post.id);

            return (
              <div
                key={post.id}
                className={`rounded-3xl border p-5 shadow-xl ${cardStyle(index)}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-cyan-200">
                    {rankLabel(index)}
                  </div>

                  {index < 3 && (
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                      TOP {index + 1}
                    </div>
                  )}
                </div>

                <h2 className="mt-3 text-xl font-black">
                  {post.title || "Perustelu"}
                </h2>

                <p className="mt-2 text-white/80">
                  {post.content || post.body || ""}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => voteForPost(post)}
                    disabled={voted}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      voted
                        ? "bg-white/10 text-white/50"
                        : "bg-pink-500/90 text-white hover:bg-pink-500"
                    }`}
                  >
                    {voted ? "Äänestetty" : "❤️ Äänestä"}
                  </button>

                  <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                    ❤️ {post.vote_count || 0} ääntä
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
