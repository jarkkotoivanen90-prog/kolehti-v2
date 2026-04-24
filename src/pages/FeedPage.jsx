import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setPosts(data);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl mb-4">Feed</h1>

      {posts.map((post) => (
        <div
          key={post.id}
          className="mb-4 p-4 rounded bg-white/10"
        >
          {post.content}
        </div>
      ))}
    </div>
  );
}
