import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { rankPosts, nextDrawLabel } from "../lib/feedAlgorithm";
import { updateStreak } from "../lib/streak";
import CharacterAvatar from "../components/CharacterAvatar";
import { characters } from "../data/characters";
import TopThree from "../components/TopThree";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [voted, setVoted] = useState({});
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [filter, setFilter] = useState("ranking");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [timeLeft, setTimeLeft] = useState(nextDrawLabel());
  const [lastVoteId, setLastVoteId] = useState(null);

  useEffect(() => {
    loadFeed();

    const timer = setInterval(() => {
      setTimeLeft(nextDrawLabel());
    }, 1000);

    const channel = supabase
      .channel("feed-pro-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => loadFeed()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => loadFeed()
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
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
    }

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
      .order("created_at", { ascending: false })
      .limit(120);

    let votesQuery = supabase.from("votes").select("*");

    if (groupId) {
      postsQuery = postsQuery.eq("group_id", groupId);
      votesQuery = votesQuery.eq("group_id", groupId);
    }

    const { data: postsData, error: postsError } = await postsQuery;
    const { data: votesData, error: votesError } = await votesQuery;

    if (postsError) {
      setToast(postsError.message);
      setLoading(false);
      return;
    }

    if (votesError) {
      setToast(votesError.message);
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

    setPosts(rankPosts(prepared));
    setVoted(votedMap);
    setLoading(false);
  }

  async function vote(post) {
    if (!user) {
      setToast("Kirjaudu ensin.");
      setTimeout(() => setToast(""), 2200);
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
      setToast("Olet jo äänestänyt tätä perustelua.");
      setTimeout(() => setToast(""), 2200);
      return;
    }

    navigator.vibrate?.(45);
    setLastVoteId(post.id);
    setToast("💗 Ääni annettu — ranking päivittyy!");

    setTimeout(() => setLastVoteId(null), 900);
    setTimeout(() => setToast(""), 2200);

    await loadFeed();
  }

  const visiblePosts = useMemo(() => {
    if (filter === "new") {
      return [...posts].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }

    if (filter === "ai") {
      return [...posts].sort(
        (a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0)
      );
    }

    if (filter === "unvoted") {
      return posts.filter((post) => !voted[post.id]);
    }

    if (filter === "near") {
      return posts.filter((post, index) => index >= 3 && index <= 8);
    }

    return posts;
  }, [posts, filter, voted]);

  const totalVotes = posts.reduce((sum, post) => sum + (post.vote_count || 0), 0);
  const myVotes = Object.keys(voted).length;
  const topPost = posts[0];

  return (
    <div className="min-h-screen bg-[#050816] pb-32 text-white">
      <style>{`
        @keyframes goldGlow {
          0%,100% { box-shadow: 0 0 28px rgba(250,204,21,.25); }
          50% { box-shadow: 0 0 85px rgba(250,204,21,.55); }
        }

        @keyframes cyanGlow {
          0%,100% { box-shadow: 0 0 24px rgba(34,211,238,.16); }
          50% { box-shadow: 0 0 65px rgba(34,211,238,.36); }
        }

        @keyframes popVote {
          0% { transform: scale(.6); opacity: 0; }
          40% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }

        .gold-glow { animation: goldGlow 2.6s ease-in-out infinite; }
        .cyan-glow { animation: cyanGlow 3s ease-in-out infinite; }
        .vote-pop { animation: popVote .8s ease-out forwards; }
      `}</style>

      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      {toast && (
        <div className="fixed left-1/2 top-5 z-[999] w-[90%] max-w-sm -translate-x-1/2 rounded-2xl border border-cyan-300/30 bg-cyan-500/20 px-4 py-3 text-center text-sm font-black text-cyan-100 shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Ranking Feed</h1>
            <p className="mt-1 text-sm font-bold text-white/60">
              {group ? `Porukka: ${group.name}` : "Kaikki perustelut"}
            </p>

            {profile && (
              <div className="mt-2 inline-flex rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-200">
                🔥 {profile.user_streak || 1} päivän streak
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              to="/new"
              className="rounded-2xl bg-cyan-500 px-5 py-3 font-black shadow-xl shadow-cyan-500/20 active:scale-95"
            >
              Uusi
            </Link>

            <Link
              to="/vote"
              className="rounded-2xl border border-pink-300/20 bg-pink-500/15 px-5 py-3 font-black text-pink-100 active:scale-95"
            >
              Äänestä
            </Link>
          </div>
        </header>

        <section className="mb-5 grid gap-3 md:grid-cols-4">
          <StatCard label="Päiväpotti" value="1000 €" sub={`⏳ ${timeLeft}`} tone="emerald" />
          <StatCard label="Ääniä" value={totalVotes} sub="Yhteensä" tone="cyan" />
          <StatCard label="Sinun äänet" value={myVotes} sub="Tässä porukassa" tone="pink" />
          <StatCard label="Kärjessä" value={topPost ? "TOP 1" : "-"} sub="Live-ranking" tone="yellow" />
        </section>

        <div className="mb-5">
          <TopThree posts={posts} />
        </div>

        {topPost && (
          <section className="mb-5 overflow-hidden rounded-[34px] border border-yellow-300/40 bg-yellow-500/10 p-5 shadow-2xl gold-glow">
            <div className="flex items-center gap-4">
              <CharacterAvatar
                character={characters[0]}
                size="md"
                showInfo={false}
                rank={1}
              />

              <div className="min-w-0 flex-1">
                <div className="text-xs font-black uppercase tracking-wide text-yellow-200">
                  🏆 Päivän kärki
                </div>

                <p className="mt-1 truncate text-xl font-black">
                  {topPost.content}
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-white/70">
                  <span>💗 {topPost.vote_count || 0} ääntä</span>
                  <span>🤖 AI {Math.round(topPost.ai_score || 0)}</span>
                  <span>⚡ Score {Math.round(topPost.final_score || topPost.rank_score || 0)}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mb-5 flex gap-2 overflow-x-auto pb-2">
          <FilterButton active={filter === "ranking"} onClick={() => setFilter("ranking")}>
            🔥 Ranking
          </FilterButton>

          <FilterButton active={filter === "new"} onClick={() => setFilter("new")}>
            🆕 Uusimmat
          </FilterButton>

          <FilterButton active={filter === "ai"} onClick={() => setFilter("ai")}>
            🤖 AI-vahvat
          </FilterButton>

          <FilterButton active={filter === "near"} onClick={() => setFilter("near")}>
            ⚡ Lähellä
          </FilterButton>

          <FilterButton active={filter === "unvoted"} onClick={() => setFilter("unvoted")}>
            💗 Äänestämättä
          </FilterButton>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            Ladataan...
          </div>
        ) : visiblePosts.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post) => {
              const realIndex = posts.findIndex((p) => p.id === post.id);

              return (
                <PostCard
                  key={post.id}
                  post={post}
                  index={realIndex}
                  voted={voted[post.id]}
                  isPop={lastVoteId === post.id}
                  onVote={() => vote(post)}
                />
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({ label, value, sub, tone }) {
  const tones = {
    emerald: "border-emerald-300/30 bg-emerald-500/15 text-emerald-200",
    cyan: "border-cyan-300/30 bg-cyan-500/15 text-cyan-200",
    pink: "border-pink-300/30 bg-pink-500/15 text-pink-200",
    yellow: "border-yellow-300/30 bg-yellow-500/15 text-yellow-200",
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-2xl ${tones[tone]}`}>
      <div className="text-xs font-black uppercase tracking-wide">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
      <div className="mt-2 text-sm font-bold text-white/65">{sub}</div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition active:scale-95 ${
        active
          ? "bg-cyan-500 text-white shadow-xl shadow-cyan-500/20"
          : "border border-white/10 bg-white/10 text-white/70"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ filter }) {
  return (
    <div className="rounded-[34px] border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
      <div className="text-6xl">✨</div>
      <h2 className="mt-4 text-2xl font-black">Ei vielä sisältöä</h2>
      <p className="mt-2 text-sm text-white/60">
        {filter === "unvoted"
          ? "Olet äänestänyt kaikki näkyvät perustelut."
          : "Tähän näkymään ei vielä löytynyt perusteluja."}
      </p>

      <div className="mt-5 flex gap-2">
        <Link
          to="/new"
          className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 font-black"
        >
          Luo perustelu
        </Link>

        <Link
          to="/groups"
          className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-black"
        >
          Porukat
        </Link>
      </div>
    </div>
  );
}

function PostCard({ post, index, voted, isPop, onVote }) {
  const character = characters[Math.max(0, index) % characters.length];
  const isTop = index === 0;
  const isNear = index >= 3 && index <= 5;
  const score = Math.round(post.final_score || post.rank_score || 0);

  return (
    <article
      className={`relative overflow-hidden rounded-[34px] border p-5 shadow-2xl transition ${
        isTop
          ? "gold-glow border-yellow-300/50 bg-yellow-500/10"
          : isNear
          ? "cyan-glow border-cyan-300/30 bg-cyan-500/10"
          : "border-white/10 bg-white/10"
      }`}
    >
      {isPop && (
        <div className="vote-pop pointer-events-none absolute right-8 top-8 z-30 text-6xl">
          💗
        </div>
      )}

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
            {isTop && <Tag className="bg-yellow-400 text-slate-950">🏆 Päivän kärki</Tag>}
            {index === 1 && <Tag className="bg-cyan-400/20 text-cyan-100">🥈 Hopea</Tag>}
            {index === 2 && <Tag className="bg-orange-400/20 text-orange-100">🥉 Pronssi</Tag>}
            {isNear && <Tag className="bg-yellow-400/15 text-yellow-200">🔥 Lähellä TOP 3</Tag>}
            {post.ai_score > 70 && <Tag className="bg-cyan-400/15 text-cyan-200">🤖 Vahva AI</Tag>}
            <Tag className="bg-white/10 text-white/60">Score {score}</Tag>
          </div>

          <h2 className="text-xl font-black">Perustelu</h2>

          <p className="mt-2 whitespace-pre-wrap text-white/80">
            {post.content}
          </p>

          {isNear && (
            <div className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-3 text-sm font-bold text-yellow-100">
              🔥 Tämä voi nousta TOP 3:een. Yksi ääni voi muuttaa tilanteen.
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onVote}
              disabled={voted}
              className={`rounded-2xl px-5 py-3 text-sm font-black shadow-xl transition active:scale-95 ${
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

            {!voted && !isTop && (
              <div className="rounded-2xl bg-yellow-500/10 px-5 py-3 text-sm font-black text-yellow-200">
                +1 ääni auttaa nousussa
              </div>
            )}
          </div>

          {!isTop && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs font-black text-white/50">
                <span>Nousupotentiaali</span>
                <span>{isNear ? "Korkea" : "Avoin"}</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-pink-400"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(18, Number(post.near_win_boost || 0) * 3 + 28)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Tag({ children, className = "" }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {children}
    </span>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[28px] border border-white/10 bg-[#081226]/95 px-4 py-2 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-bold">
        <Link to="/">🏠<div>Koti</div></Link>

        <Link to="/feed" className="text-cyan-300">
          📋<div>Feed</div>
        </Link>

        <Link to="/new" className="-mt-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-500 text-4xl shadow-xl shadow-blue-500/40">
            +
          </div>
          <div>Uusi</div>
        </Link>

        <Link to="/vote">
          💗<div>Äänestä</div>
        </Link>

        <Link to="/profile">
          👤<div>Profiili</div>
        </Link>
      </div>
    </div>
  );
}
