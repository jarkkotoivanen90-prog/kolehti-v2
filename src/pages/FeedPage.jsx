import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();

    const channel = supabase
      .channel("live-ranking-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => init()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => init()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function init() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user || null);

    const groupId = localStorage.getItem("kolehti_group_id");

    if (groupId) {
      const { data: groupData } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      setGroup(groupData || null);
    } else {
      setGroup(null);
    }

    let postsQuery = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (groupId) {
      postsQuery = postsQuery.eq("group_id", groupId);
    }

    const { data: postsData, error: postsError } = await postsQuery;

    let votesQuery = supabase.from("votes").select("*");

    if (groupId) {
      votesQuery = votesQuery.eq("group_id", groupId);
    }

    const { data: votesData, error: votesError } = await votesQuery;

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

    const groupId = localStorage.getItem("kolehti_group_id");

    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      post_id: post.id,
      group_id: groupId || null,
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
            {group ? `Porukka: ${group.name}` : "Ei valittua porukkaa"}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/new"
            className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-bold"
          >
            Uusi
          </Link>

          <Link
            to="/groups"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            Porukat
          </Link>

          <button
            onClick={init}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            Päivitä
          </button>
        </div>
      </div>

      {!group && (
        <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          Valitse ensin porukka.
          <Link to="/groups" className="ml-2 font-bold text-cyan-200">
            Mene porukkiin →
          </Link>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
          Ei vielä postauksia tässä porukassa.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => {
            const voted = hasVoted(post.id);

            return (
              <div
                key={post.id}
                className={`rounded-3xl border p-5 shadow-xl ${cardStyle(
                  index
                )}`}
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
