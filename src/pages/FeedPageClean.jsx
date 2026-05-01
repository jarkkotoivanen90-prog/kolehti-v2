import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { mergeWithBots, botTicker, makeBotRepliesForPost } from "../lib/bots";
import { haptic } from "../lib/effects";
import { rankGodFeed, saveFeedSignal, whyForYou } from "../lib/godFeed";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [hint, setHint] = useState(true);
  const seenRef = useRef({});
  const lastIndexRef = useRef(0);

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const tickerTimer = setInterval(() => setTicker(botTicker()), 3500);
    const hintTimer = setTimeout(() => setHint(false), 5200);
    const channel = supabase
      .channel("kolehti-ai-backend-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, load)
      .subscribe();

    return () => {
      clearInterval(tickerTimer);
      clearTimeout(hintTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const post = posts[activeIndex];
    if (!post?.id || post.bot || seenRef.current[post.id]) return;
    seenRef.current[post.id] = true;
    const timer = setTimeout(() => {
      saveFeedSignal(post, "views");
      supabase.rpc("record_ai_feed_signal", { target_post_id: post.id, event: "feed_view" }).then(({ error }) => {
        if (error) {
          supabase.from("user_events").insert({
            user_id: user?.id || null,
            post_id: post.id,
            event_type: "feed_view",
            source: "god_mode_feed_fallback",
            meta: { activeIndex, media: Boolean(getPostMedia(post).url) },
          });
        }
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [activeIndex, posts, user?.id]);

  function handleScroll(e) {
    const height = window.innerHeight || 1;
    const next = Math.round(e.currentTarget.scrollTop / height);
    if (next !== activeIndex) {
      const previous = posts[lastIndexRef.current];
      if (previous && Math.abs(next - lastIndexRef.current) >= 1) {
        saveFeedSignal(previous, "skips");
        if (!previous.bot) supabase.rpc("record_ai_feed_signal", { target_post_id: previous.id, event: "feed_skip" });
      }
      lastIndexRef.current = next;
      setActiveIndex(next);
      setHint(false);
      haptic("tap");
    }
  }

  async function load() {
    const aiFeed = await supabase.rpc("match_ai_feed", { match_count: 80 });

    if (!aiFeed.error && Array.isArray(aiFeed.data) && aiFeed.data.length) {
      setPosts(mergeWithBots(aiFeed.data, 8));
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    setPosts(rankGodFeed(mergeWithBots(data || [], 8)));
    setLoading(false);
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white">
      <PreloadMedia posts={posts} activeIndex={activeIndex} />

      <div className="pointer-events-none fixed left-4 top-[82px] z-50 flex flex-col gap-1.5">
        {posts.slice(0, 7).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-8 bg-cyan-200" : "w-3 bg-white/30"}`} />
        ))}
      </div>

      <div className="pointer-events-none fixed right-4 top-[82px] z-50 rounded-full border border-cyan-300/20 bg-black/42 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80 backdrop-blur-xl">AI For You</div>

      {hint && !loading && posts.length > 1 && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-black/50 px-5 py-3 text-sm font-black text-white/85 shadow-2xl backdrop-blur-xl animate-bounce">Pyyhkäise ylös ↑</div>
      )}

      {ticker && (
        <div className="pointer-events-none fixed left-1/2 top-[86px] z-50 w-[calc(100%-132px)] max-w-xs -translate-x-1/2 rounded-full border border-cyan-300/25 bg-[#030816]/72 px-4 py-2 text-center text-xs font-black text-cyan-100 shadow-2xl shadow-blue-500/10 backdrop-blur-xl">🤖 {ticker}</div>
      )}

      <main onScroll={handleScroll} className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading && <div className="grid h-[100dvh] place-items-center text-sm font-black text-cyan-100/70">Ladataan AI-feediä...</div>}
        {!loading && posts.length === 0 && <EmptyFeed />}
        {posts.map((post, index) => <TikTokFeedCard key={post.id} post={post} active={index === activeIndex} user={user} onRefresh={load} />)}
      </main>

      <AppBottomNav />
    </div>
  );
}

function PreloadMedia({ posts, activeIndex }) {
  const next = posts.slice(activeIndex + 1, activeIndex + 4).map(getPostMedia).filter((m) => m.url && m.type === "image");
  return <>{next.map((m) => <img key={m.url} src={m.url} alt="" className="hidden" />)}</>;
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

function TikTokFeedCard({ post, active, user, onRefresh }) {
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(false);
  const [busyLike, setBusyLike] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const replies = useMemo(() => makeBotRepliesForPost(post, post.bot ? 1 : 2), [post.id, post.score, post.votes]);
  const media = getPostMedia(post);
  const score = Math.round(post.backend_score || post.score || post.winner_score || post.ai_score || 0);
  const baseVotes = Number(post.votes || post.vote_count || 0);
  const votes = baseVotes + (liked ? 1 : 0);
  const views = Number(post.watch_time_total || post.views || 0);
  const shares = Number(post.shares || 0) + (shareToast ? 1 : 0);
  const author = post.bot ? post.bot_name : post.display_name || post.username || "Pelaaja";
  const avatar = post.bot ? post.bot_avatar || "🤖" : String(author || "P").slice(0, 1).toUpperCase();
  const why = post.ai_similarity > 0 ? `AI match ${Math.round(post.ai_similarity * 100)}%` : whyForYou(post);

  async function likePulse() {
    setLiked(true);
    setBurst(true);
    saveFeedSignal(post, "likes");
    haptic("heavy");
    setTimeout(() => setBurst(false), 650);

    if (!user?.id || post.bot || busyLike) return;
    setBusyLike(true);
    try {
      await supabase.from("votes").upsert({ post_id: post.id, user_id: user.id, value: 1 }, { onConflict: "user_id,post_id" });
      await supabase.rpc("record_ai_feed_signal", { target_post_id: post.id, event: "feed_like" });
      setTimeout(() => onRefresh?.(), 500);
    } finally {
      setBusyLike(false);
    }
  }

  async function sharePost() {
    haptic("tap");
    saveFeedSignal(post, "shares");
    const text = `${post.content}\n\nKolehti`;
    try {
      if (navigator.share) await navigator.share({ title: "Kolehti", text, url: window.location.href });
      else await navigator.clipboard?.writeText(window.location.href);
    } catch {}
    if (user?.id && !post.bot) {
      supabase.rpc("record_ai_feed_signal", { target_post_id: post.id, event: "feed_share" });
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 1200);
  }

  return (
    <article onDoubleClick={likePulse} className="relative h-[100dvh] snap-start overflow-hidden bg-[#050816]">
      {media.type === "video" && media.url ? (
        <video src={media.url} className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ${active ? "scale-100" : "scale-105"}`} autoPlay={active} muted loop playsInline preload={active ? "auto" : "metadata"} />
      ) : (
        <img src={media.url || FALLBACK_BG} alt="" className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ${active ? "scale-100" : "scale-105"}`} loading={active ? "eager" : "lazy"} decoding="async" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/8 to-black/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(34,211,238,.20),transparent_34%)]" />
      <div className="absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-64 bg-gradient-to-t from-black via-black/68 to-transparent" />

      {burst && <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center text-8xl text-pink-200 drop-shadow-2xl animate-[ping_.65s_ease-out_1]">♥</div>}
      {shareToast && <div className="pointer-events-none absolute left-1/2 top-32 z-50 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2 text-xs font-black text-white backdrop-blur-xl">Jaettu / linkki kopioitu</div>}

      <header className="absolute left-4 right-4 top-6 z-20 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-3xl border border-cyan-200/25 bg-cyan-300/12 text-2xl font-black shadow-2xl shadow-cyan-500/15 backdrop-blur-xl">K</div>
        <div>
          <div className="text-3xl font-black tracking-tight drop-shadow">KOLEHTI</div>
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/75">Äänestä · nosta · voita</div>
        </div>
      </header>

      <aside className="absolute bottom-[168px] right-3 z-30 flex flex-col items-center gap-3">
        <button type="button" onClick={likePulse} className="transition active:scale-90"><ActionBubble icon="♥" label={votes || 0} active={liked} /></button>
        <ActionBubble icon="👀" label={views || 0} />
        <button type="button" onClick={sharePost} className="transition active:scale-90"><ActionBubble icon="↗" label={shares || 0} /></button>
        <ActionBubble icon="AI" label={score} small />
      </aside>

      <section className={`absolute bottom-[112px] left-0 right-0 z-20 px-4 transition-all duration-500 ${active ? "translate-y-0 opacity-100" : "translate-y-5 opacity-80"}`}>
        <div className="max-h-[60dvh] overflow-hidden rounded-[34px] border border-white/18 bg-black/40 p-5 shadow-2xl shadow-black/45 backdrop-blur-2xl">
          <div className="mb-3 inline-flex rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/85">AI For You · {why}</div>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 text-lg font-black">{avatar}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-black">{author}</div>
              <div className="text-[11px] font-black uppercase tracking-wide text-cyan-100/70">{post.bot ? "Pelibotti" : "Osallistuminen / viikko"}</div>
            </div>
            <div className="rounded-full border border-cyan-100/20 bg-cyan-300/12 px-3 py-2 text-sm font-black text-cyan-100">{score} XP</div>
          </div>

          <p className="mt-5 line-clamp-5 text-[25px] font-black leading-[1.22] tracking-tight text-white drop-shadow-xl sm:text-[28px]">{post.content}</p>

          <div className="mt-4 flex gap-4 text-sm font-black text-white/60">
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

function ActionBubble({ icon, label, small, active }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`grid ${small ? "h-12 w-12 text-xs" : "h-14 w-14 text-xl"} place-items-center rounded-full border font-black shadow-2xl shadow-black/30 backdrop-blur-xl transition ${active ? "border-pink-200/50 bg-pink-500/35 text-pink-50" : "border-white/18 bg-black/36 text-white"}`}>
        {icon}
      </div>
      <div className="max-w-[54px] truncate text-center text-[11px] font-black text-white/85 drop-shadow">{label}</div>
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
      <div className="flex items-start gap-3 rounded-[26px] border border-cyan-100/12 bg-[#030816]/62 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
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
