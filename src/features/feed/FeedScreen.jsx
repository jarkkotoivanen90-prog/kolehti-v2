import { useEffect, useState } from "react";
import FeedCard from "./FeedCard";
import { supabase } from "../../lib/supabaseClient";

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("posts").select("*").limit(50);
    setPosts(data || []);
  }

  return (
    <main
      className="h-screen overflow-y-auto snap-y snap-mandatory"
      onScroll={(e) => {
        const index = Math.round(e.currentTarget.scrollTop / window.innerHeight);
        setActive(index);
      }}
    >
      {posts.map((p, i) => (
        <FeedCard
          key={p.id}
          post={p}
          active={i === active}
          index={i}
        />
      ))}
    </main>
  );
}
