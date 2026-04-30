import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { mergeWithBots, botTicker, makeBotRepliesForPost } from "../lib/bots";

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
        {posts.map((p) => (
          <FeedCard key={p.id} post={p} />
        ))}
      </main>

      <AppBottomNav />
    </div>
  );
}

function FeedCard({ post }) {
  const replies = useMemo(() => makeBotRepliesForPost(post, post.bot ? 1 : 2), [post.id, post.score]);

  return (
    <article className="premium-card mx-4 mb-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${post.bot ? "border-cyan-200/18 bg-cyan-300/10" : "border-white/10 bg-white/[.055]"} text-sm font-black text-white shadow-[0_0_18px_rgba(21,131,255,.10)]`}>
            {post.bot ? post.bot_avatar || "🤖" : "P"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white">
              {post.bot ? post.bot_name : "Pelaaja"}
            </div>
            <div className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-cyan-100/62">
              {post.bot ? `🤖 ${post.bot_disclosure || "Pelibotti"}` : "Pelaaja"}
            </div>
          </div>
        </div>
        <div className="rounded-full border border-cyan-100/12 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
          {Math.round(post.score || 0)} XP
        </div>
      </div>

      <p className="mt-4 text-[15px] font-bold leading-relaxed text-white/84">{post.content}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-white/50">
        <span>♥ {post.votes || 0}</span>
        <span>👀 {post.watch_time_total || 0}</span>
        <span>↗ {post.shares || 0}</span>
        {post.near_win && <span className="text-cyan-100">near win</span>}
        {post.bot_rival && <span className="text-cyan-100">rival</span>}
      </div>

      <BotReplyThread replies={replies} />
    </article>
  );
}

function BotReplyThread({ replies }) {
  if (!replies?.length) return null;

  return (
    <div className="mt-5 space-y-3 border-t border-white/8 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/58">Bot replies</p>
        <span className="rounded-full border border-cyan-100/10 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black text-cyan-100">{replies.length}</span>
      </div>
      {replies.map((reply) => (
        <div key={reply.id} className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-cyan-200/16 bg-cyan-300/10 text-xs font-black text-cyan-100 shadow-[0_0_16px_rgba(21,131,255,.12)]">
            {reply.bot_avatar || "🤖"}
          </div>
          <div className="min-w-0 flex-1 rounded-[22px] border border-cyan-100/10 bg-[#030816]/62 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-black text-white">🤖 {reply.bot_name}</p>
              <p className="shrink-0 text-[9px] font-black uppercase tracking-wide text-cyan-100/55">{reply.disclosure}</p>
            </div>
            <p className="mt-1.5 text-sm font-bold leading-snug text-white/78">{reply.text}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/45">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-sky-400 to-blue-600" style={{ width: `${Math.max(10, Math.min(100, reply.pressure || 45))}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
