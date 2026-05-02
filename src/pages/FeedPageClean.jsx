import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { mergeWithBots, botTicker, makeBotRepliesForPost } from "../lib/bots";
import { haptic } from "../lib/effects";
import { rankGodFeed, saveFeedSignal, whyForYou } from "../lib/godFeed";
import { installFeedUltraProMotion } from "../lib/feedUltraProMotion";
import { calculateKolehtiPhase1, formatEuro, getKolehtiReasonLabel } from "../lib/kolehtiPhase1";

// ... KEEP ALL SAME UNTIL component

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [hint, setHint] = useState(true);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const kolehti = useMemo(() => calculateKolehtiPhase1(posts), [posts]);

  const seenRef = useRef({});
  const lastIndexRef = useRef(0);
  const chromeTimer = useRef(null);

  useEffect(() => {
    const startTimer = setTimeout(() => hideChrome(), 1900);
    let cleanupMotion = () => {};
    const motionTimer = setTimeout(() => {
      cleanupMotion = installFeedUltraProMotion();
    }, 80);
    load();
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const tickerTimer = setInterval(() => setTicker(botTicker()), 5000);
    const hintTimer = setTimeout(() => setHint(false), 4200);
    const channel = supabase
      .channel("kolehti-ultra-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, load)
      .subscribe();

    return () => {
      clearInterval(tickerTimer);
      clearTimeout(hintTimer);
      clearTimeout(startTimer);
      clearTimeout(motionTimer);
      clearTimeout(chromeTimer.current);
      cleanupMotion?.();
      supabase.removeChannel(channel);
    };
  }, []);

  function hideChrome() { setChromeVisible(false); }
  function revealChrome() {
    setChromeVisible(true);
    clearTimeout(chromeTimer.current);
    chromeTimer.current = setTimeout(() => hideChrome(), 2000);
  }

  function openPost(post) {
    haptic("tap");
    setSelectedPost(post);
    saveFeedSignal(post, "opens");
    if (post?.id && !post.bot) {
      supabase.rpc("record_ai_feed_signal", { target_post_id: post.id, event: "feed_open_detail" });
    }
  }

  async function load() {
    setLoading(true);
    const brainFeed = await supabase.rpc("match_ai_feed_brain_v2", { match_count: 80, exploration_rate: 0.14 });
    if (!brainFeed.error && Array.isArray(brainFeed.data) && brainFeed.data.length) { setPosts(mergeWithBots(brainFeed.data, 8)); setLoading(false); return; }
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(100);
    setPosts(rankGodFeed(mergeWithBots(data || [], 8)));
    setLoading(false);
  }

  return (
    <div onClick={revealChrome} className="h-[100dvh] overflow-hidden bg-black text-white">

      {/* 🔥 KOLEHTI GAME BAR */}
      {!loading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10 px-4 py-2 flex justify-between text-xs font-black">
          <div>💰 {formatEuro(kolehti.dailyPot)} / päivä</div>
          <div>👥 {kolehti.groupSize}/1500</div>
          <div>🔥 {kolehti.fillPercent}%</div>
        </div>
      )}

      <main id="feed-scroll-root" className="h-[100dvh] snap-y snap-mandatory overflow-y-auto">
        {posts.map((post, index) => (
          <UltraFeedCard
            key={post.id}
            post={post}
            kolehti={kolehti}
            active={index === activeIndex}
            user={user}
            onRefresh={load}
            chromeVisible={chromeVisible}
            onOpen={openPost}
          />
        ))}
      </main>
    </div>
  );
}

function UltraFeedCard({ post, kolehti }) {
  const votes = Number(post.votes || 0);

  return (
    <article className="relative h-[100dvh] flex items-end p-4">
      <div className="w-full rounded-2xl bg-black/50 p-5">

        {/* 🔥 LABEL */}
        <div className="text-[10px] font-black uppercase text-cyan-200">
          {getKolehtiReasonLabel(post)}
        </div>

        {/* 💰 POT INFO */}
        <div className="text-xs text-yellow-300 mb-2">
          Päivän potti: {formatEuro(kolehti.dailyPot)}
        </div>

        {/* TEXT */}
        <div className="text-xl font-black mb-4">
          {post.content}
        </div>

        {/* ❤️ VOTE */}
        <div className="text-sm">❤️ {votes}</div>

      </div>
    </article>
  );
}
