import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { haptic, reward } from "../lib/effects";
import AppBottomNav from "../components/AppBottomNav";

// (feed logic unchanged, nav replaced)

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);
  const [hiddenChrome, setHiddenChrome] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("posts").select("*").limit(50);
    setPosts(data || []);
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white">
      <main className="h-[100dvh] overflow-y-auto">
        {posts.map((p) => (
          <div key={p.id} className="premium-card m-4 p-6">
            {p.content}
          </div>
        ))}
      </main>

      <AppBottomNav hidden={hiddenChrome} />
    </div>
  );
}
