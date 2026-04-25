import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function NewPostPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handlePost(e) {
    e.preventDefault();

    if (!content.trim()) {
      alert("Kirjoita perustelu ensin.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Kirjaudu ensin.");
      setLoading(false);
      return;
    }

    const groupId = localStorage.getItem("kolehti_group_id");

    const { error } = await supabase.from("posts").insert([
      {
        content: content.trim(),
        user_id: user.id,
        group_id: groupId || null,
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setContent("");
    navigate("/feed");
  }

  return (
    <div className="mx-auto max-w-2xl p-6 text-white">
      <h1 className="text-3xl font-black">Uusi perustelu</h1>
      <p className="mt-1 text-white/60">
        Kirjoita perustelu, joka voi nousta porukan rankingissa.
      </p>

      <form
        onSubmit={handlePost}
        className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5"
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
