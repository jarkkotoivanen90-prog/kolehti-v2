import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [myVotes, setMyVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user || null);

    if (!user) {
      setLoading(false);
      return;
    }

    const groupId = localStorage.getItem("kolehti_group_id");

    if (groupId) {
      const { data: groupData } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      setGroup(groupData || null);
    }

    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: votesData } = await supabase
      .from("votes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setMyPosts(postsData || []);
    setMyVotes(votesData || []);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("kolehti_group_id");
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-white">
        Ladataan profiilia...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
          <h1 className="text-3xl font-black">Profiili</h1>
          <p className="mt-2 text-white/60">Et ole kirjautunut sisään.</p>

          <Link
            to="/login"
            className="mt-5 inline-block rounded-2xl bg-cyan-500 px-5 py-3 font-bold"
          >
            Kirjaudu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 text-white">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Profiili</h1>
          <p className="mt-1 text-sm text-white/60">{user.email}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/feed"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            Feed
          </Link>

          <Link
            to="/groups"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
          >
            Porukat
          </Link>

          <button
            onClick={logout}
            className="rounded-2xl bg-pink-500 px-4 py-2 text-sm font-bold"
          >
            Kirjaudu ulos
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <div className="text-sm font-bold text-cyan-200">Aktiivinen porukka</div>
          <div className="mt-2 text-2xl font-black">
            {group ? group.name : "Ei valittu"}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <div className="text-sm font-bold text-cyan-200">Omat perustelut</div>
          <div className="mt-2 text-2xl font-black">{myPosts.length}</div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <div className="text-sm font-bold text-cyan-200">Annetut äänet</div>
          <div className="mt-2 text-2xl font-black">{myVotes.length}</div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Omat perustelut</h2>

          <Link
            to="/new"
            className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-bold"
          >
            Uusi
          </Link>
        </div>

        {myPosts.length === 0 ? (
          <p className="text-white/60">Et ole vielä tehnyt perusteluja.</p>
        ) : (
          <div className="space-y-3">
            {myPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <p className="text-white/90">{post.content || post.body || ""}</p>
                <p className="mt-2 text-xs text-white/40">
                  {post.created_at
                    ? new Date(post.created_at).toLocaleString("fi-FI")
                    : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
