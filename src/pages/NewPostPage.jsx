import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePost } from "../hooks/useCreatePost";

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { createPost, submitting, error } = useCreatePost();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();

    if (!body.trim()) return;

    const post = await createPost({
      title: title.trim(),
      body: body.trim(),
    });

    navigate("/feed", { state: { createdPostId: post.id } });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <div className="rounded-[28px] border border-white/12 bg-white/8 p-6 backdrop-blur-xl">
        <div className="text-2xl font-black">Uusi perustelu</div>
        <div className="mt-2 text-white/70">
          Kerro lyhyesti ja selkeästi miksi tarvitset tukea.
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/70">Otsikko</label>
            <input
              className="w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-white outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Esim. Tarvitsen apua vuokraan"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">Perustelu</label>
            <textarea
              className="min-h-[180px] w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-white outline-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tarvitsen apua koska..."
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={submitting || !body.trim()}
            className="rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-black disabled:opacity-60"
            type="submit"
          >
            {submitting ? "Lähetetään..." : "Lähetä perustelu"}
          </button>
        </form>
      </div>
    </div>
  );
}
