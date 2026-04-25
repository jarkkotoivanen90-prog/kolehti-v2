import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";

export default function NewPostPage() {
  const [content, setContent] = useState("");
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadGroup();
  }, []);

  async function loadGroup() {
    const groupId = localStorage.getItem("kolehti_group_id");

    if (!groupId) return;

    const { data } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    setGroup(data || null);
  }

  async function handlePost(e) {
    e.preventDefault();

    if (!content.trim()) return alert("Kirjoita perustelu ensin.");

    const groupId = localStorage.getItem("kolehti_group_id");

    if (!groupId) {
      alert("Valitse ensin porukka.");
      navigate("/groups");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return alert("Kirjaudu ensin.");
    }

    const { error } = await supabase.from("posts").insert({
      content: content.trim(),
      user_id: user.id,
      group_id: groupId,
    });

    setLoading(false);

    if (error) return alert(error.message);

    setContent("");
    navigate("/feed");
  }

  return (
    <div className="mx-auto max-w-2xl p-6 text-white">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Uusi perustelu</h1>
          <p className="mt-1 text-white/60">
            {group ? `Porukka: ${group.name}` : "Porukkaa ei ole valittu."}
          </p>
        </div>

        <Link
          to="/groups"
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 font-bold"
        >
          Porukat
        </Link>
      </div>

      {!group && (
        <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
          Valitse ensin porukka ennen postaamista.
        </div>
      )}

      <form
        onSubmit={handlePost}
        className="rounded-3xl border border-white/10 bg-white/10 p-5"
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Kirjoita perustelu..."
          className="min-h-40 w-full rounded-2xl border border-white/10 bg-white/10 p-4 text-white outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-2xl bg-cyan-500 px-5 py-3 font-bold disabled:opacity-60"
        >
          {loading ? "Lähetetään..." : "Lähetä perustelu"}
        </button>
      </form>
    </div>
  );
}
