import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { mergeWithBots } from "../lib/bots";
import { rankGodFeed } from "../lib/godFeed";
import { calculateKolehtiPhase1, formatEuro } from "../lib/kolehtiPhase1";

import TopHUD from "../components/TopHUD";
import BottomSheetMenu from "../components/BottomSheetMenu";
import { useFeedHUD } from "../hooks/useFeedHUD";

export default function FeedPageV3() {
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const { visible, onScroll, reveal, trackLeader, pulseKey } = useFeedHUD();

  const kolehti = useMemo(() => calculateKolehtiPhase1(posts), [posts]);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (posts.length) trackLeader(posts[0].id); }, [posts]);

  async function load() {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    setPosts(rankGodFeed(mergeWithBots(data || [], 6)));
  }

  function handleScroll(e) {
    const height = window.innerHeight || 1;
    const index = Math.round(e.currentTarget.scrollTop / height);
    setActiveIndex(index);
    onScroll(e.currentTarget.scrollTop);
  }

  const current = posts[activeIndex] || {};

  const hudData = {
    pot: formatEuro(kolehti.dailyPot),
    users: kolehti.groupSize,
    joined: true,
    leader: posts[0]?.display_name || "-",
    likes: current.votes || 0,
    ai: Math.round(current.ai_score || 0),
    trending: (current.votes || 0) > 5,
  };

  return (
    <div className="h-[100dvh] bg-black text-white" onClick={reveal}>
      <TopHUD visible={visible} data={hudData} pulseKey={pulseKey} onMenu={() => setMenuOpen(true)} />

      <main onScroll={handleScroll} className="h-full snap-y snap-mandatory overflow-y-auto">
        {posts.map((post) => (
          <section key={post.id} className="relative h-[100dvh] snap-start overflow-hidden">

            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black" />

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="rounded-[28px] border border-white/12 bg-black/50 backdrop-blur-xl p-5 shadow-2xl">
                <div className="text-lg font-black">{post.display_name || "User"}</div>
                <div className="mt-3 text-2xl font-black leading-tight">{post.content}</div>
              </div>
            </div>

          </section>
        ))}
      </main>

      <BottomSheetMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
