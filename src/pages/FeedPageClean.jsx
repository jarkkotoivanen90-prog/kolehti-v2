import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { mergeWithBots, botTicker, makeBotRepliesForPost } from "../lib/bots";

const FALLBACK_BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1400";

function getPostMedia(post) {
  const url = post?.video_url || post?.image_url || post?.media_url || "";
  const type = post?.media_type || (/\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : url ? "image" : null);
  return { url, type };
}

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const t = setInterval(() => setTicker(botTicker()), 3500);
    const channel = supabase
      .channel("kolehti-tiktok-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, load)
      .subscribe();

    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    setPosts(mergeWithBots(data || [], 8));
    setLoading(false);
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white">
      {ticker && (
        <div className="pointer-events-none fixed left-1/2 top-[86px] z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-full border border-cyan-300/25 bg-[#030816]/72 px-4 py-2 text-center text-xs font-black text-cyan-100 shadow-2xl shadow-blue-500/10 backdrop-blur-xl">
          🤖 {ticker}
        </div>
      )}

      <main className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth">
        {loading && <div className="grid h-[100dvh] place-items-center text-sm font-black text-cyan-100/70">Ladataan feediä...</div>}
        {!loading && posts.length === 0 && <EmptyFeed />}
        {posts.map((post) => <TikTokFeedCard key={post.id} post={post} />)}
      </main>

      <AppBottomNav />
    </div>
  );
}

function EmptyFeed() {
  return (
    <section className="grid h-[100dvh] snap-start place-items-center bg-[#050816] px-6 text-center">
      <div>
        <div className="text-6xl">🔥</div>
        <h2 className="mt-4 text-3xl font-black">Feed on tyhjä</h2>
        <p className="mt-2 text-sm font-bold text-white/60">Luo ensimmäinen postaus Uusi-välilehdeltä.</p>
      </div>
    </section>
  );
}

function TikTokFeedCard({ post }) {
  const replies = useMemo(() => makeBotRepliesForPost(post, post.bot ? 1 : 2), [post.id, post.score, post.votes]);
  const media = getPostMedia(post);
  const score = Math.round(post.score || post.winner_score || post.ai_score || 0);
  const votes = Number(post.votes || post.vote_count || 0);
  const views = Number(post.watch_time_total || post.views || 0);
  const shares = Number(post.shares || 0);
  const author = post.bot ? post.bot_name : post.display_name || post.username || "Pelaaja";
  const avatar = post.bot ? post.bot_avatar || "🤖" : String(author || "P").slice(0, 1).toUpperCase();

  return (
    <article className="relative h-[100dvh] snap-start overflow-hidden bg-[#050816]">
      {media.type === "video" && media.url ? (
        <video src={media.url} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
      ) : (
        <img src={media.url || FALLBACK_BG} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/92" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(34,211,238,.18),transparent_38%)]" />
      <div className="absolute left-0 right-0 top-0 z-10 h-28 bg-gradient-to-b from-black/70 to-transparent" />

      <header className="absolute left-4 right-4 top-6 z-20 flex items-center gap-3 pt-safe">
        <div className="grid h-14 w-14 place-items-center rounded-3xl border border-cyan-200/25 bg-cyan-300/12 text-2xl font-black shadow-2xl shadow-cyan-500/15 backdrop-blur-xl">K</div>
        <div>
          <div className="text-3xl font-black tracking-tight">KOLEHTI</div>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/70">Äänestä · nosta · voita</div>
        </div>
      </header>

      <aside className="absolute bottom-[150px] right-4 z-30 flex flex-col items-center gap-4">
        <ActionBubble icon="♥" label={votes || 0} />
        <ActionBubble icon="👀" label={views || 0} />
        <ActionBubble icon="↗" label={shares || 0} />
        <ActionBubble icon="AI" label={score} small />
      </aside>

      <section className="absolute bottom-[118px] left-0 right-0 z-20 px-4">
        <div className="max-h-[58dvh] overflow-hidden rounded-[34px] border border-white/18 bg-black/42 p-5 shadow-2xl shadow-black/45 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 text-lg font-black">{avatar}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-black">{author}</div>
              <div className="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">{post.bot ? "Pelibotti" : "Osallistuminen / viikko"}</div>
            </div>
            <div className="rounded-full border border-cyan-100/20 bg-cyan-300/12 px-3 py-2 text-sm font-black text-cyan-100">{score} XP</div>
          </div>

          <p className="mt-5 line-clamp-6 text-[25px] font-black leading-[1.25] tracking-tight text-white drop-shadow-xl sm:text-[28px]">{post.content}</p>

          <div className="mt-4 flex gap-4 text-sm font-black text-white/58">
            <span>♥ {votes}</span>
            <span>👀 {views}</span>
            <span>↗ {shares}</span>
          </div>

          <BotReplyStrip replies={replies} />
        </div>
      </section>
    </article>
  );
}

function ActionBubble({ icon, label, small }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`grid ${small ? "h-12 w-12 text-xs" : "h-14 w-14 text-xl"} place-items-center rounded-full border border-white/18 bg-black/36 font-black shadow-2xl shadow-black/30 backdrop-blur-xl`}>
        {icon}
      </div>
      <div className="max-w-[54px] truncate text-center text-[11px] font-black text-white/80 drop-shadow">{label}</div>
    </div>
  );
}

function BotReplyStrip({ replies }) {
  if (!replies?.length) return null;
  const first = replies[0];

  return (
    <div className="mt-5 border-t border-white/12 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/65">Bot replies</p>
        <span className="rounded-full border border-cyan-100/16 bg-cyan-300/10 px-3 py-1 text-[10px] font-black text-cyan-100">{replies.length}</span>
      </div>
      <div className="flex items-start gap-3 rounded-[26px] border border-cyan-100/12 bg-[#030816]/60 px-4 py-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-200/18 bg-cyan-300/10 text-sm font-black text-cyan-100">{first.bot_avatar || "🤖"}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-black">🤖 {first.bot_name}</p>
            <p className="shrink-0 text-[9px] font-black uppercase tracking-wide text-cyan-100/55">{first.disclosure}</p>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-white/78">{first.text}</p>
        </div>
      </div>
    </div>
  );
}
