import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { mergeWithBots, botTicker, makeBotRepliesForPost } from "../lib/bots";
import { haptic } from "../lib/effects";
import { rankGodFeed, saveFeedSignal, whyForYou } from "../lib/godFeed";

const FALLBACK_BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1400";

// 🔥 NOTE: AppBottomNav removed → unified global nav used

function getPostMedia(post) {
  const url = post?.video_url || post?.image_url || post?.media_url || "";
  const type = post?.media_type || (/\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : url ? "image" : null);
  return { url, type };
}

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hint, setHint] = useState(true);
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeTimer = useRef(null);

  useEffect(() => {
    load();
    const tickerTimer = setInterval(() => setTicker(botTicker()), 5000);
    const hintTimer = setTimeout(() => setHint(false), 4200);
    const startTimer = setTimeout(() => hideChrome(), 1700);

    return () => {
      clearInterval(tickerTimer);
      clearTimeout(hintTimer);
      clearTimeout(startTimer);
      clearTimeout(chromeTimer.current);
    };
  }, []);

  function hideChrome() {
    setChromeVisible(false);
  }

  function revealChrome() {
    setChromeVisible(true);
    clearTimeout(chromeTimer.current);
    chromeTimer.current = setTimeout(() => hideChrome(), 1800);
  }

  async function load() {
    const aiFeed = await supabase.rpc("match_ai_feed_v3", { match_count: 50 });
    setPosts(aiFeed.data || []);
    setLoading(false);
  }

  return (
    <div onClick={revealChrome} className="h-[100dvh] overflow-hidden bg-black text-white">
      <main className="h-[100dvh] overflow-y-auto">
        {posts.map((post) => (
          <div key={post.id} className="h-[100dvh] flex items-center justify-center">
            <p className="text-xl font-bold">{post.content}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
