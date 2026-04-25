import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function NewPostPage() {
  const [content, setContent] = useState("");
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setPageLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user || null);

    const groupId = localStorage.getItem("kolehti_group_id");

    if (groupId) {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

      if (!error) {
        setGroup(data);
      }
    }

    setPageLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      alert("Kirjaudu ensin.");
      navigate("/login");
      return;
    }

    const groupId = localStorage.getItem("kolehti_group_id");

    if (!groupId) {
      alert("Valitse ensin porukka.");
      navigate("/groups");
      return;
    }

    if (!content.trim()) {
      alert("Kirjoita perustelu ensin.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("posts").insert({
      content: content.trim(),
      user_id: user.id,
      group_id: groupId,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setContent("");
    navigate("/feed");
  }

  if (pageLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-white">
        Ladataan...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 text-white">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Uusi perustelu</h1>
          <p className="mt-1 text-sm text-white/60">
            {group ? `Porukka: ${group.name}` : "Porukkaa ei ole valittu"}
          </p>
        </div>

        <div className="flex gap-2">
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
        </div>
      </div>

      {!group && (
        <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          Valitse ensin porukka ennen postaamista.
          <Link to="/groups" className="ml-2 font-bold text-cyan-200">
            Mene porukkiin →
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl"
      >
        <label className="text-sm font-bold text-cyan-200">
          Kirjoita perustelu
        </label>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Esim. Tarvitsen apua vuokraan..."
          className="mt-3 min-h-44 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white outline-none placeholder:text-white/40"
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-white/50">
            {content.length}/500 merkkiä
          </p>

          <button
            type="submit"
            disabled={loading || !group}
            className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? "Lähetetään..." : "Postaa"}
          </button>
        </div>
      </form>
    </div>
  );
}
