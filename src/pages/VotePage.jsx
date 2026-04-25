import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function VotePage() {
  const [posts, setPosts] = useState([]);
  const [current, setCurrent] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setPosts(data || []);
  }

  async function vote(postId) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Kirjaudu ensin.");
      return;
    }

    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      post_id: postId,
    });

    if (error) {
      if (error.code === "23505") {
        setMessage("Olet jo äänestänyt tätä perustelua.");
      } else {
        setMessage(error.message);
      }
      return;
    }

    setMessage("Ääni tallennettu ✅");
    setCurrent((prev) => Math.min(prev + 1, posts.length - 1));
  }

  const post = posts[current];

  if (!post) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold">Äänestä</h1>
        <p className="mt-4 text-white/70">Ei vielä äänestettäviä postauksia.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 text-white">
      <h1 className="text-2xl font-bold">Äänestä</h1>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-6">
        <div className="text-sm text-white/50">
          {current + 1} / {posts.length}
        </div>

        <h2 className="mt-3 text-xl font-bold">
          {post.title || "Perustelu"}
        </h2>

        <p className="mt-3 text-white/80">
          {post.content || post.body}
        </p>

        <button
          onClick={() => vote(post.id)}
          className="mt-6 w-full rounded-2xl bg-cyan-500 px-4 py-3 font-bold text-white"
        >
          Anna ääni
        </button>

        <button
          onClick={() => setCurrent((prev) => Math.min(prev + 1, posts.length - 1))}
          className="mt-3 w-full rounded-2xl border border-white/10 px-4 py-3 text-white"
        >
          Ohita
        </button>

        {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
      </div>
    </div>
  );
}
