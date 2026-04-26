import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { rankPosts } from "../lib/feedAlgorithm";
import CharacterAvatar from "../components/CharacterAvatar";
import { characters } from "../data/characters";

export default function VotePage() {
  const [posts, setPosts] = useState([]);
  const [voted, setVoted] = useState({});
  const [user, setUser] = useState(null);
  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user || null);

    const groupId = localStorage.getItem("kolehti_group_id");

    let postsQuery = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    let votesQuery = supabase.from("votes").select("*");

    if (groupId) {
      postsQuery = postsQuery.eq("group_id", groupId);
      votesQuery = votesQuery.eq("group_id", groupId);
    }

    const { data: postsData } = await postsQuery;
    const { data: votesData } = await votesQuery;

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

    setPosts(rankPosts(prepared));
    setVoted(votedMap);
    setLoading(false);
  }

  const voteQueue = useMemo(
    () => posts.filter((post) => !voted[post.id]),
    [posts, voted]
  );

  const post = voteQueue[index];

  async function handleVote(value) {
    if (!user) {
      alert("Kirjaudu ensin.");
      return;
    }

    if (!post) return;

    const groupId = localStorage.getItem("kolehti_group_id");

    if (value === 1) {
      const { error } = await supabase.from("votes").insert({
        post_id: post.id,
        user_id: user.id,
        group_id: groupId || post.group_id || null,
        value: 1,
      });

      if (error) {
        setToast("Olet jo äänestänyt tämän.");
        setTimeout(() => setToast(""), 1800);
        setIndex((i) => i + 1);
        return;
      }

      navigator.vibrate?.(50);
      setToast("💗 Ääni annettu");
      setTimeout(() => setToast(""), 1600);
    }

    setIndex((i) => i + 1);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] p-6 text-white">
        Ladataan...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#050816] px-4 py-10 text-white">
        <div className="mx-auto max-w-md rounded-[34px] border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
          <div className="text-6xl">🎉</div>
          <h1 className="mt-4 text-3xl font-black">Kaikki nähty</h1>
          <p className="mt-2 text-white/60">
            Olet käynyt tämän porukan perustelut läpi.
          </p>

          <div className="mt-6 flex gap-2">
            <Link
              to="/feed"
              className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 font-black"
            >
              Feed
            </Link>
            <Link
              to="/new"
              className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-black"
            >
              Uusi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const character = characters[index % characters.length];

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-6 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      {toast && (
        <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-2xl border border-pink-300/30 bg-pink-500/20 px-5 py-3 text-sm font-black text-pink-100 shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      )}

      <main className="mx-auto flex min-h-[90vh] max-w-md flex-col justify-center">
        <div className="mb-5 text-center">
          <h1 className="text-4xl font-black">Äänestä</h1>
          <p className="mt-1 text-sm font-bold text-white/55">
            Pyyhkäise tai paina sydäntä
          </p>
        </div>

        <div className="relative rounded-[38px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-400/20 blur-3xl" />

          <div className="relative">
            <div className="mb-4 flex justify-center">
              <CharacterAvatar
                character={character}
                size="xl"
                showInfo={false}
              />
            </div>

            <div className="rounded-[26px] bg-black/25 p-5">
              <div className="text-xs font-black uppercase tracking-wide text-cyan-200">
                Perustelu
              </div>

              <p className="mt-3 whitespace-pre-wrap text-xl font-black leading-relaxed">
                {post.content}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                  💗 {post.vote_count || 0} ääntä
                </span>

                {post.ai_score ? (
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-black text-cyan-200">
                    🤖 AI {Math.round(post.ai_score)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-6">
              <button
                onClick={() => handleVote(0)}
                className="grid h-20 w-20 place-items-center rounded-full bg-white text-4xl text-red-500 shadow-2xl transition active:scale-90"
              >
                ✕
              </button>

              <button
                onClick={() => handleVote(1)}
                className="grid h-20 w-20 place-items-center rounded-full bg-emerald-400 text-4xl text-white shadow-2xl shadow-emerald-400/30 transition active:scale-90"
              >
                💗
              </button>
            </div>
          </div>
        </div>

        <Link
          to="/feed"
          className="mt-5 text-center text-sm font-black text-cyan-200"
        >
          Takaisin feediin
        </Link>
      </main>
    </div>
  );
}
