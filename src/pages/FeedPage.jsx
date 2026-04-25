import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);

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

    setVotes(votesData || []);

    const ranked = rankPosts(postsData || [], votesData || []);
    setPosts(ranked);

    setLoading(false);
  }

  function getVoteCount(postId) {
    return votes.filter((vote) => vote.post_id === postId).length;
  }

  function hasVoted(postId) {
    if (!user) return false;

    return votes.some(
      (vote) => vote.post_id === postId && vote.user_id === user.id
    );
  }

  function rankPosts(postsList, votesList) {
    const voteCounts = {};

    votesList.forEach((vote) => {
      voteCounts[vote.post_id] = (voteCounts[vote.post_id] || 0) + 1;
    });

    return postsList
      .map((post) => ({
        ...post,
        vote_count: voteCounts[post.id] || 0,
      }))
      .sort((a, b) => {
        if (b.vote_count !== a.vote_count) {
          return b.vote_count - a.vote_count;
        }

        return new Date(b.created_at) - new Date(a.created_at);
      });
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
            Eniten ääniä saanut perustelu nousee kärkeen.
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
            const count = getVoteCount(post.id);

            return (
              <div
                key={post.id}
                className="rounded-3xl border border-white/10 bg-white/10 p-5"
              >
                <div className="text-sm font-black text-cyan-200">
                  #{index + 1}
                </div>

                <h2 className="mt-2 text-xl font-black">
                  {post.title || "Perustelu"}
                </h2>

                <p className="mt-2 text-white/80">
                  {post.content || post.body || ""}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => voteForPost(post)}
                    disabled={voted}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      voted
                        ? "bg-white/10 text-white/50"
                        : "bg-pink-500/80 text-white hover:bg-pink-500"
                    }`}
                  >
                    {voted ? "Äänestetty" : "❤️ Äänestä"}
                  </button>

                  <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
                    ❤️ {count} ääntä
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
