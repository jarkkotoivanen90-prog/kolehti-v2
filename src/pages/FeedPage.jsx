import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getRankScore, nextDrawLabel } from "../lib/ranking";
import CharacterAvatar from "../components/CharacterAvatar";
import { characters } from "../data/characters";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [voted, setVoted] = useState({});
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    const groupId = localStorage.getItem("kolehti_group_id");

    if (groupId) {
      const { data: groupData } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      setGroup(groupData || null);
    }

    let postsQuery = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

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

    const ranked = (postsData || [])
      .map((post) => {
        const withVotes = {
          ...post,
          vote_count: voteCounts[post.id] || 0,
        };

        return {
          ...withVotes,
          rank_score: getRankScore(withVotes),
        };
      })
      .sort((a, b) => b.rank_score - a.rank_score);

    setPosts(ranked);
    setVoted(votedMap);
    setLoading(false);
  }

  async function vote(post) {
    if (!user) return;

    const groupId = localStorage.getItem("kolehti_group_id");

    const { error } = await supabase.from("votes").insert({
      post_id: post.id,
      user_id: user.id,
      group_id: groupId || post.group_id || null,
    });

    if (error) {
      alert("Olet jo äänestänyt tätä perustelua.");
      return;
    }

    await loadFeed();
  }

  return (
    <div className="min-h-screen bg-[#050816] pb-28 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Ranking Feed</h1>
            <p className="mt-1 text-sm font-bold text-white/60">
              {group ? `Porukka: ${group.name}` : "Kaikki perustelut"}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/new"
              className="rounded-2xl bg-cyan-500 px-5 py-3 font-black shadow-xl shadow-cyan-500/20"
            >
              Uusi
            </Link>

            <Link
              to="/groups"
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-black"
            >
              Porukat
            </Link>
          </div>
        </div>

        <section className="mb-5 grid gap-3 md:grid-cols-3">
          <MoneyCard title="Päiväpotti" amount="1000 €" time={nextDrawLabel()} color="emerald" />
          <MoneyCard title="Viikkopotti" amount="3000 €" time="Viikonloppuna" color="cyan" />
          <MoneyCard title="Kuukausipotti" amount="5000 €" time="Kuukauden lopussa" color="pink" />
        </section>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            Ladataan...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            Ei vielä postauksia tässä porukassa.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                voted={voted[post.id]}
                onVote={() => vote(post)}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function MoneyCard({ title, amount, time, color }) {
  const colors = {
    emerald: "border-emerald-300/30 bg-emerald-500/15 text-emerald-200",
    cyan: "border-cyan-300/30 bg-cyan-500/15 text-cyan-200",
    pink: "border-pink-300/30 bg-pink-500/15 text-pink-200",
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-2xl ${colors[color]}`}>
      <div className="text-xs font-black uppercase tracking-wide">{title}</div>
      <div className="mt-2 text-4xl font-black">{amount}</div>
      <div className="mt-2 text-sm font-bold text-white/65">{time}</div>
    </div>
  );
}

function PostCard({ post, index, voted, onVote }) {
  const isTop = index === 0;
  const character = characters[index % characters.length];

  return (
    <div
      className={`relative overflow-hidden rounded-[34px] border p-5 shadow-2xl ${
        isTop
          ? "border-yellow-300/50 bg-yellow-500/10 shadow-yellow-500/20"
          : "border-white/10 bg-white/10"
      }`}
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative flex gap-4">
        <CharacterAvatar
          character={character}
          size="md"
          showInfo={false}
          rank={index + 1}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {index === 0 && (
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-slate-950">
                🏆 Päivän kärki
              </span>
            )}

            {index === 1 && (
              <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-black text-cyan-100">
                🥈 Hopeasija
              </span>
            )}

            {index === 2 && (
              <span className="rounded-full bg-orange-400/20 px-3 py-1 text-xs font-black text-orange-100">
                🥉 Pronssisija
              </span>
            )}

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/60">
              Score {Math.round(post.rank_score || 0)}
            </span>
          </div>

          <h2 className="text-xl font-black">Perustelu</h2>

          <p className="mt-2 whitespace-pre-wrap text-white/80">
            {post.content}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onVote}
              disabled={voted}
              className={`rounded-2xl px-5 py-3 text-sm font-black shadow-xl transition ${
                voted
                  ? "bg-white/15 text-white/60"
                  : "bg-pink-500 text-white shadow-pink-500/20 hover:scale-105"
              }`}
            >
              {voted ? "Äänestetty" : "💗 Äänestä"}
            </button>

            <div className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black">
              💗 {post.vote_count || 0} ääntä
            </div>

            {post.ai_score ? (
              <div className="rounded-2xl bg-cyan-500/15 px-5 py-3 text-sm font-black text-cyan-200">
                🤖 AI {Math.round(post.ai_score)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[28px] border border-white/10 bg-[#081226]/95 px-4 py-2 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-bold">
        <Link to="/">🏠<div>Koti</div></Link>
        <Link to="/feed" className="text-cyan-300">📋<div>Feed</div></Link>
        <Link to="/new" className="-mt-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-500 text-4xl shadow-xl shadow-blue-500/40">
            +
          </div>
          <div>Uusi</div>
        </Link>
        <Link to="/vote">💗<div>Äänestä</div></Link>
        <Link to="/profile">👤<div>Profiili</div></Link>
      </div>
    </div>
  );
}
