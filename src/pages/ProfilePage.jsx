import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import CharacterAvatar from "../components/CharacterAvatar";
import NotificationBell from "../components/NotificationBell";
import { characters } from "../data/characters";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [copied, setCopied] = useState(false);
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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData || null);

    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);

    const { data: votesData } = await supabase
      .from("votes")
      .select("*")
      .eq("user_id", user.id);

    setVotes(votesData || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const inviteLink = useMemo(() => {
    if (!user?.id) return "";
    return `${window.location.origin}/login?ref=${user.id}`;
  }, [user]);

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-6 pb-32 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#153b92_0%,#050816_45%,#02030a_100%)]" />

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

        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-[30px] border border-white/10 bg-white/10 p-5 shadow-2xl">
            <CharacterAvatar
              character={characters[0]}
              size="xl"
              showInfo={false}
            />
          </div>

          <Stat title="Omat perustelut" value={posts.length} />
          <Stat title="Annetut äänet" value={votes.length} />
          <Stat title="Streak" value={`🔥 ${profile?.user_streak || 1}`} />
        </section>

        <section className="mt-5 rounded-[34px] border border-cyan-300/20 bg-cyan-500/10 p-5 shadow-2xl">
          <h2 className="text-2xl font-black">🚀 Kutsu kavereita</h2>

          <p className="mt-2 text-sm font-bold text-white/65">
            Jaa linkki. Kun uusi käyttäjä liittyy, porukka kasvaa ja saat enemmän näkyvyyttä.
          </p>

          <div className="mt-4 break-all rounded-2xl bg-black/30 p-4 text-sm font-bold text-cyan-200">
            {inviteLink}
          </div>

          <button
            onClick={copyInvite}
            className="mt-4 w-full rounded-2xl bg-cyan-500 px-5 py-4 text-lg font-black shadow-xl shadow-cyan-500/20"
          >
            {copied ? "Kopioitu ✅" : "Kopioi kutsulinkki"}
          </button>
        </section>

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
                    <span>{new Date(post.created_at).toLocaleString("fi-FI")}</span>
                    <span>🤖 AI {Math.round(post.ai_score || 0)}</span>
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
      <div className="mt-3 text-4xl font-black">{value}</div>
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
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">
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
