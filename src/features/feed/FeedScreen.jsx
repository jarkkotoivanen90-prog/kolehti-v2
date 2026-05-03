import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { mergeWithBots } from "../../lib/bots";
import { rankGodFeed, saveFeedSignal } from "../../lib/godFeed";
import { haptic } from "../../lib/effects";
import { calculateKolehtiPhase1, formatEuro } from "../../lib/kolehtiPhase1";
import TopHUD from "../../components/TopHUD";
import BottomSheetMenu from "../../components/BottomSheetMenu";
import AppBottomNav from "../../components/AppBottomNav";
import { useFeedHUD } from "../../hooks/useFeedHUD";
import FeedCard from "./FeedCard";
import useAdaptiveAccent from "./hooks/useAdaptiveAccent";
import { getScore, getVotes, getViews, getShares } from "./utils/feedFormatters";

// ...rest unchanged until render

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  // ...unchanged

  const current = posts[activeIndex] || {};
  const accent = useAdaptiveAccent(current);

  const hudData = {
    pot: formatEuro(kolehti.dailyPot),
    users: `${kolehti.groupSize}/${kolehti.groupMax || 1500}`,
    joined: Boolean(likedPosts[current.id]),
    leader: posts[0]?.display_name || posts[0]?.username || "-",
    likes: getVotes(current) + (likedPosts[current.id] ? 1 : 0),
    ai: Math.max(0, Math.min(99, getScore(current))),
    trending: getVotes(current) >= 5 || getShares(current) >= 2,
  };

  return (
    <div
      className="h-[100dvh] overflow-hidden bg-black text-white"
      onClick={reveal}
      style={accent.style}
    >
      <TopHUD visible={visible} data={hudData} pulseKey={pulseKey} onMenu={() => setMenuOpen(true)} />

      <main onScroll={handleScroll} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scroll-behavior:auto] touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {posts.length === 0 && <EmptyState />}
        {posts.map((post, index) => (
          <FeedCard
            key={post.id}
            post={post}
            index={index}
            active={index === activeIndex}
            leader={index === 0}
            liked={Boolean(likedPosts[post.id])}
            shared={Boolean(sharedPosts[post.id])}
            onLike={() => likePost(post)}
            onShare={() => sharePost(post)}
            onExplain={() => setSheet({ type: "explain", post })}
            onMoney={() => setSheet({ type: "money", post: current })}
          />
        ))}
      </main>

      <AppBottomNav floating gesture />

      <AnimatePresence>
        {pulse && <FeedbackPulse type={pulse} />}
        {toast && <Toast message={toast} />}
        {/* rest unchanged */}
      </AnimatePresence>

      <BottomSheetMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} />
    </div>
  );
}
