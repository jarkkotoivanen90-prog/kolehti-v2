import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { mergeWithBots, botTicker, makeBotRepliesForPost } from "../lib/bots";
import { trackConversionEvent, getConversionBadge, getSupportGapText } from "../lib/conversionAnalytics";

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);
  const [ticker, setTicker] = useState("");

  useEffect(() => {
    load();
    const t = setInterval(() => setTicker(botTicker()), 3000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    const { data } = await supabase.from("posts").select("*").limit(50);
    const merged = mergeWithBots(data || []);
    setPosts(merged);
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white">
      {ticker && (
        <div className="fixed left-1/2 top-20 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-full border border-cyan-300/25 bg-white/10 px-4 py-2 text-center text-xs font-black text-cyan-100 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl">
          🤖 {ticker}
        </div>
      )}

      <main id="feed-scroll-root" className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth pb-[170px] pt-20 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {posts.map((p, i) => (
          <FeedCard key={p.id} post={p} rank={i + 1} />
        ))}
      </main>

      <AppBottomNav />
    </div>
  );
}

function FeedCard({ post, rank }) {
  const replies = useMemo(() => makeBotRepliesForPost(post, post.bot ? 1 : 2), [post.id, post.score]);
  const badge = getConversionBadge({ rank, supportScore: post.score });

  useEffect(() => {
    trackConversionEvent("post_view", { postId: post.id, rank });
  }, [post.id, rank]);

  return (
    <article
      className="mx-4 mb-6 min-h-[72dvh] snap-center rounded-[34px] border border-cyan-100/25 bg-white/[.055] p-5 text-white shadow-[0_18px_54px_rgba(0,0,0,.34),0_0_34px_rgba(14,165,255,.14),inset_0_1px_0_rgba(255,255,255,.18)] backdrop-blur-2xl [-webkit-backdrop-filter:blur(28px)] transition-transform duration-200 ease-out will-change-transform active:scale-[0.985]"
      style={{ transform: "translateZ(0)", contain: "layout paint style" }}
    >
      <div className="mb-3 inline-flex rounded-full border border-cyan-100/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-cyan-100 backdrop-blur-xl">{badge}</div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${post.bot ? "border-cyan-200/18 bg-cyan-300/10" : "border-white/10 bg-white/[.055]"}`}>
            {post.bot ? post.bot_avatar || "🤖" : "P"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black">{post.bot ? post.bot_name : "Pelaaja"}</div>
          </div>
        </div>
        <div className="rounded-full border border-cyan-100/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100 backdrop-blur-xl">#{rank}</div>
      </div>

      <p className="mt-5 text-[28px] font-black leading-[1.06] tracking-[-0.045em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.55)]">{post.content}</p>

      <div className="mt-4 rounded-2xl border border-cyan-100/15 bg-cyan-300/10 px-4 py-3 text-xs font-black text-cyan-100 backdrop-blur-xl">
        {getSupportGapText(post.support_gap)}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="flex-1 rounded-2xl bg-cyan-500 py-3 font-black text-black"
          onClick={() => trackConversionEvent("support_click", { postId: post.id })}
        >
          ❤️ Tue 1€
        </button>

        <button
          className="flex-1 rounded-2xl border border-white/15 bg-white/10 py-3 font-black text-white backdrop-blur-xl"
          onClick={() => trackConversionEvent("boost_click", { postId: post.id })}
        >
          🔥 Boost
        </button>
      </div>

      <BotReplyThread replies={replies} />
    </article>
  );
}

function BotReplyThread({ replies }) {
  if (!replies?.length) return null;

  return (
    <div className="mt-5 space-y-3 border-t border-white/8 pt-4">
      {replies.map((reply) => (
        <div key={reply.id} className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-cyan-100/15 bg-cyan-300/10 backdrop-blur-xl">🤖</div>
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-xl">
            <p className="text-sm font-bold leading-snug text-white/82">{reply.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
