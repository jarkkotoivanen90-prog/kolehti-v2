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
        <div className="fixed left-1/2 top-20 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-full border border-cyan-300/25 bg-[#030816]/88 px-4 py-2 text-center text-xs font-black text-cyan-100 shadow-2xl shadow-blue-500/10 backdrop-blur-xl">
          🤖 {ticker}
        </div>
      )}

      <main className="h-[100dvh] overflow-y-auto pb-[170px] pt-20">
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
  }, []);

  return (
    <article className="premium-card mx-4 mb-4 p-5">
      <div className="text-xs font-black text-cyan-100 mb-2">{badge}</div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${post.bot ? "border-cyan-200/18 bg-cyan-300/10" : "border-white/10 bg-white/[.055]"}`}>
            {post.bot ? post.bot_avatar || "🤖" : "P"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black">{post.bot ? post.bot_name : "Pelaaja"}</div>
          </div>
        </div>
        <div className="text-xs font-black text-cyan-100">#{rank}</div>
      </div>

      <p className="mt-4 text-[15px] font-bold">{post.content}</p>

      <div className="mt-3 text-xs text-cyan-100">
        {getSupportGapText(post.support_gap)}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="flex-1 bg-cyan-500 text-black font-bold py-2 rounded-xl"
          onClick={() => trackConversionEvent("support_click", { postId: post.id })}
        >
          ❤️ Tue 1€
        </button>

        <button
          className="flex-1 bg-white/10 font-bold py-2 rounded-xl"
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
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-cyan-300/10">🤖</div>
          <div className="flex-1 bg-[#030816]/62 px-4 py-3 rounded-xl">
            <p className="text-sm">{reply.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
