import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import GlassCard from "../components/GlassCard";
import { mergeWithBots, botTicker, makeBotRepliesForPost } from "../lib/bots";
import { trackConversionEvent, getConversionBadge, getSupportGapText } from "../lib/conversionAnalytics";

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);
  const [ticker, setTicker] = useState("");

  useEffect(() => {
    load();
    const timer = setInterval(() => setTicker(botTicker()), 3000);
    return () => clearInterval(timer);
  }, []);

  async function load() {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    setPosts(mergeWithBots(data || []));
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-transparent text-white">
      {ticker && (
        <div className="fixed left-1/2 top-20 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-center text-xs font-black text-white shadow-2xl shadow-black/20 backdrop-blur-2xl">
          {ticker}
        </div>
      )}

      <main id="feed-scroll-root" className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth pb-[170px] pt-20 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {posts.map((post, index) => (
          <FeedCard key={post.id} post={post} rank={index + 1} />
        ))}
      </main>

      <AppBottomNav />
    </div>
  );
}

function FeedCard({ post, rank }) {
  const replies = useMemo(() => makeBotRepliesForPost(post, post.bot ? 1 : 2), [post.id, post.bot, post.score]);
  const badge = getConversionBadge({ rank, supportScore: post.score || post.ai_score || 0, gap: post.support_gap });

  useEffect(() => {
    trackConversionEvent("post_view", { postId: post.id, rank });
  }, [post.id, rank]);

  function trackSupport() {
    trackConversionEvent("support_click", { postId: post.id, rank });
  }

  function trackBoost() {
    trackConversionEvent("boost_click", { postId: post.id, rank });
  }

  return (
    <GlassCard
      className="mx-4 mb-6 min-h-[72dvh] snap-center p-5 text-white transition-transform duration-200 ease-out will-change-transform active:scale-[0.985]"
      style={{ transform: "translateZ(0)", contain: "layout paint style" }}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/85 backdrop-blur-xl">{badge}</span>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/75 backdrop-blur-xl">#{rank}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-sm font-black text-white backdrop-blur-xl">
            {post.bot ? post.bot_avatar || "AI" : "P"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.45)]">{post.bot ? post.bot_name : post.display_name || "Pelaaja"}</div>
            <div className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-white/65">{post.bot ? "AI-pelibotti" : "Yhteisön perustelu"}</div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-[30px] font-black leading-[1.05] tracking-[-0.05em] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,.62)]">
        {post.content}
      </p>

      <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black text-white/80 backdrop-blur-xl">
        {getSupportGapText(post.support_gap)}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={trackSupport} className="rounded-2xl border border-white/25 bg-white/80 px-4 py-3 text-sm font-black text-black shadow-[0_10px_30px_rgba(0,0,0,.18)] active:scale-[0.98]">
          Tue 1€
        </button>
        <button type="button" onClick={trackBoost} className="rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-black text-white backdrop-blur-xl active:scale-[0.98]">
          Boost
        </button>
      </div>

      <BotReplyThread replies={replies} />
    </GlassCard>
  );
}

function BotReplyThread({ replies }) {
  if (!replies?.length) return null;

  return (
    <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
      {replies.map((reply) => (
        <div key={reply.id} className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm font-bold leading-snug text-white/80 backdrop-blur-xl">
          {reply.text}
        </div>
      ))}
    </div>
  );
}
