import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadRanking();
  }, []);

  async function loadRanking() {
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postsError) return;

    const { data: votesData } = await supabase
      .from("votes")
      .select("post_id");

    const voteCounts = {};

    (votesData || []).forEach((vote) => {
      voteCounts[vote.post_id] = (voteCounts[vote.post_id] || 0) + 1;
    });

    const ranked = (postsData || [])
      .map((post) => ({
        ...post,
        vote_count: voteCounts[post.id] || 0,
      }))
      .sort((a, b) => b.vote_count - a.vote_count);

    setPosts(ranked);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 text-white">
      <h1 className="text-2xl font-bold">Ranking Feed</h1>

      <div className="mt-6 space-y-4">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="rounded-3xl border border-white/10 bg-white/10 p-5"
          >
            <div className="text-sm text-cyan-200">#{index + 1}</div>
            <h2 className="mt-2 text-xl font-bold">
              {post.title || "Perustelu"}
            </h2>
            <p className="mt-2 text-white/80">
              {post.content || post.body}
            </p>
            <div className="mt-4 rounded-full bg-white/10 px-3 py-1 text-sm inline-block">
              ❤️ {post.vote_count} ääntä
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
