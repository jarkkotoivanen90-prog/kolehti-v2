import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import CharacterAvatar from "../components/CharacterAvatar";
import NotificationBell from "../components/NotificationBell";
import ProgressCard from "../components/ProgressCard";
import AchievementCard from "../components/AchievementCard";
import NextGoalCard from "../components/NextGoalCard";
import DailyRewardCard from "../components/DailyRewardCard";
import XPToast from "../components/XPToast";
import LevelUpModal from "../components/LevelUpModal";
import { characters } from "../data/characters";
import { updateLastSeen, trackRetentionEvent } from "../lib/retention";
import { syncAchievements } from "../lib/achievements";
import { checkLevelUp } from "../lib/rewards";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [xpToast, setXpToast] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    setUser(user);

    await trackRetentionEvent(user.id, "profile_open");

    const updatedProfile = await updateLastSeen(user.id);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: votesData } = await supabase
      .from("votes")
      .select("*")
      .eq("user_id", user.id);

    const syncedProfile = await syncAchievements(
      user.id,
      updatedProfile || profileData,
      postsData || [],
      votesData || []
    );

    const finalProfile = syncedProfile || updatedProfile || profileData || null;

    setProfile(finalProfile);
    setPosts(postsData || []);
    setVotes(votesData || []);

    const levelCheck = await checkLevelUp(user.id);
    if (levelCheck?.levelUp) {
      setLevelUp(levelCheck.level);
    }
  }

  async function logout() {
    await trackRetentionEvent(user?.id, "logout");
    await supabase.auth.signOut();
    navigate("/login");
  }

  const inviteLink = useMemo(() => {
    if (!user?.id) return "";
    return `${window.location.origin}/login?ref=${user.id}`;
  }, [user]);

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink);
    await trackRetentionEvent(user?.id, "invite_copy");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const bestPost = useMemo(() => {
    if (!posts.length) return null;

    return [...posts].sort(
      (a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0)
    )[0];
  }, [posts]);

  const bestRankFromPosts = useMemo(() => {
    const ranks = posts
      .map((post) => Number(post.best_rank || 0))
      .filter((rank) => rank > 0);

    if (!ranks.length) return null;

    return Math.min(...ranks);
  }, [posts]);

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-6 pb-32 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

      {/* XP POP */}
      <XPToast value={xpToast?.value} text={xpToast?.text} />

      {/* LEVEL UP MODAL */}
      <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />

      <main className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black">Profiili</h1>
            <p className="mt-1 text-sm font-bold text-white/55">
              {user?.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />

            <button
              onClick={logout}
              className="rounded-2xl bg-pink-500 px-4 py-3 text-sm font-black"
            >
              Ulos
            </button>
          </div>
        </header>

        {/* STATS */}
        <section className="grid gap-3 md:grid-cols-6">
          <div className="rounded-[30px] border border-white/10 bg-white/10 p-5 shadow-2xl md:col-span-1">
            <CharacterAvatar
              character={characters[0]}
              size="xl"
              showInfo={false}
            />
          </div>

          <Stat title="Badge" value={profile?.active_badge || "🌱"} />
          <Stat title="Level" value={`LVL ${profile?.level || 1}`} />
          <Stat title="XP" value={profile?.xp || 0} />
          <Stat title="Saavutukset" value={profile?.achievement_score || 0} />
          <Stat title="Postaukset" value={posts.length} />
          <Stat title="Äänet" value={votes.length} />
          <Stat title="Streak" value={`🔥 ${profile?.user_streak || 1}`} />
          <Stat
            title="Paras sijoitus"
            value={bestRankFromPosts ? `#${bestRankFromPosts}` : "-"}
          />
        </section>

        {/* PROGRESSION */}
        <div className="mt-5">
          <ProgressCard profile={profile} />
        </div>

        {/* DAILY REWARD */}
        <div className="mt-5">
          <DailyRewardCard
            user={user}
            onClaim={(result) => {
              setXpToast({
                value: result.xp,
                text: "Päivän palkinto",
              });

              setTimeout(() => setXpToast(null), 1800);

              loadProfile();
            }}
          />
        </div>

        {/* NEXT GOAL */}
        <div className="mt-5">
          <NextGoalCard profile={profile} />
        </div>

        {/* ACHIEVEMENTS */}
        <div className="mt-5">
          <AchievementCard profile={profile} />
        </div>

        {/* BEST POST */}
        {bestPost && (
          <section className="mt-5 rounded-[34px] border border-yellow-300/20 bg-yellow-500/10 p-5 shadow-2xl">
            <h2 className="text-2xl font-black text-yellow-200">
              🏆 Paras perustelusi
            </h2>

            <p className="mt-3 text-lg font-black text-white">
              {bestPost.content}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-2xl bg-black/25 px-4 py-3 text-sm font-black text-yellow-100">
                🤖 AI {Math.round(bestPost.ai_score || 0)}
              </div>

              {bestPost.best_rank && (
                <div className="rounded-2xl bg-black/25 px-4 py-3 text-sm font-black text-cyan-100">
                  #{bestPost.best_rank}
                </div>
              )}
            </div>
          </section>
        )}

        {/* INVITE */}
        <section className="mt-5 rounded-[34px] border border-cyan-300/20 bg-cyan-500/10 p-5 shadow-2xl">
          <h2 className="text-2xl font-black">🚀 Kutsu kavereita</h2>

          <p className="mt-2 text-sm font-bold text-white/65">
            Jaa linkki ja kasvata porukkaasi.
          </p>

          <div className="mt-4 break-all rounded-2xl bg-black/30 p-4 text-sm font-bold text-cyan-200">
            {inviteLink}
          </div>

          <button
            onClick={copyInvite}
            className="mt-4 w-full rounded-2xl bg-cyan-500 px-5 py-4 text-lg font-black"
          >
            {copied ? "Kopioitu ✅" : "Kopioi linkki"}
          </button>
        </section>

        {/* POSTS */}
        <section className="mt-5 rounded-[34px] border border-white/10 bg-white/10 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">Omat perustelut</h2>

            <Link
              to="/new"
              className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-black"
            >
              Uusi
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl bg-black/20 p-4 text-white/60">
              Ei vielä perusteluja.
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="font-black">{post.content}</div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-white/55">
                    <span>
                      {new Date(post.created_at).toLocaleString("fi-FI")}
                    </span>
                    <span>🤖 {Math.round(post.ai_score || 0)}</span>
                    {post.best_rank && <span>🏆 #{post.best_rank}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/10 p-5 shadow-2xl">
      <div className="text-sm font-black text-cyan-200">{title}</div>
      <div className="mt-3 text-3xl font-black break-words">{value}</div>
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[30px] border border-white/10 bg-[#061126]/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end text-center text-xs font-black">
        <Link to="/">🏠<div>Koti</div></Link>
        <Link to="/feed">🔥<div>Feed</div></Link>
        <Link to="/new" className="-mt-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl">
            +
          </div>
          <div>Uusi</div>
        </Link>
        <Link to="/vote">💗<div>Äänestä</div></Link>
        <Link to="/profile" className="text-cyan-300">👤<div>Profiili</div></Link>
      </div>
    </nav>
  );
}
