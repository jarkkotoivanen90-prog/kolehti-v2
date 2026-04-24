import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    setPosts(data);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Feed</h1>

      {posts.map((p) => (
        <div key={p.id}>{p.content}</div>
      ))}
    </div>
  );
}
