import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import GlassCard from "../components/GlassCard";
import { mergeWithBots, makeBotRepliesForPost } from "../lib/bots";
import { trackConversionEvent, getConversionBadge, getSupportGapText } from "../lib/conversionAnalytics";

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    setPosts(mergeWithBots(data || []));
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-transparent text-white">
      <main className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth pb-[170px] pt-20">
        {posts.map((post, index) => (
          <FeedCard key={post.id} post={post} rank={index + 1} />
        ))}
      </main>
      <AppBottomNav />
    </div>
  );
}

function FeedCard({ post, rank }) {
  const replies = useMemo(() => makeBotRepliesForPost(post, post.bot ? 1 : 2), [post.id]);
  const badge = getConversionBadge({ rank, supportScore: post.score || 0 });

  useEffect(() => {
    trackConversionEvent("post_view", { postId: post.id, rank });
  }, [post.id]);

  return (
    <GlassCard className="mx-4 mb-6 min-h-[72dvh] snap-center p-5">
      <div className="mb-3 text-xs text-white/80">{badge}</div>

      <p className="mt-4 text-[28px] font-black leading-tight">
        {post.content}
      </p>

      <div className="mt-4 text-xs text-white/70">
        {getSupportGapText(post.support_gap)}
      </div>

      <div className="mt-5 flex gap-2">
        <button className="flex-1 bg-white/80 text-black py-3 rounded-xl font-bold">Tue</button>
        <button className="flex-1 bg-white/20 py-3 rounded-xl font-bold">Boost</button>
      </div>

      <div className="mt-4 space-y-2">
        {replies.map((r) => (
          <div key={r.id} className="text-sm text-white/70">{r.text}</div>
        ))}
      </div>
    </GlassCard>
  );
}
