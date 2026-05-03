import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";
import { mergeWithBots } from "../lib/bots";
import { rankGodFeed, saveFeedSignal } from "../lib/godFeed";
import { haptic } from "../lib/effects";
import { calculateKolehtiPhase1, formatEuro } from "../lib/kolehtiPhase1";

import TopHUD from "../components/TopHUD";
import BottomSheetMenu from "../components/BottomSheetMenu";
import { useFeedHUD } from "../hooks/useFeedHUD";

const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=2200&q=90",
  "https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=2200&q=90",
];

function stableIndex(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash % BACKGROUNDS.length;
}

function getMedia(post) {
  const url = post?.video_url || post?.image_url || post?.media_url || "";
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url) || post?.media_type === "video";
  return {
    url: url || BACKGROUNDS[stableIndex(post?.id || post?.content || "kolehti")],
    type: isVideo ? "video" : "image",
    fallback: !url,
  };
}

function getScore(post) {
  return Math.round(post?.ai_score || post?.backend_score || post?.winner_score || post?.score || 0);
}

function isTrending(post, index) {
  const votes = Number(post?.votes || post?.vote_count || 0);
  const score = getScore(post);
  return index <= 2 && (votes >= 5 || score >= 75);
}

export default function FeedPageV3() {
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [toast, setToast] = useState("");

  const { visible, onScroll, reveal, trackLeader, pulseKey } = useFeedHUD();
  const kolehti = useMemo(() => calculateKolehtiPhase1(posts), [posts]);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (posts.length) trackLeader(posts[0].id); }, [posts, trackLeader]);

  async function load() {
    const brainFeed = await supabase.rpc("match_ai_feed_brain_v2", { match_count: 80, exploration_rate: 0.14 });
    if (!brainFeed.error && Array.isArray(brainFeed.data) && brainFeed.data.length) {
      setPosts(mergeWithBots(brainFeed.data, 6));
      return;
    }

    const aiFeed = await supabase.rpc("match_ai_feed", { match_count: 80 });
    if (!aiFeed.error && Array.isArray(aiFeed.data) && aiFeed.data.length) {
      setPosts(mergeWithBots(aiFeed.data, 6));
      return;
    }

    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(80);
    setPosts(rankGodFeed(mergeWithBots(data || [], 6)));
  }

  function handleScroll(event) {
    const height = window.innerHeight || 1;
    const index = Math.round(event.currentTarget.scrollTop / height);
    setActiveIndex(Math.max(0, Math.min(index, posts.length - 1)));
    onScroll(event.currentTarget.scrollTop);
  }

  async function likePost(post) {
    if (!post?.id) return;
    haptic?.("heavy");
    saveFeedSignal?.(post, "likes");
    setLikedPosts((current) => ({ ...current, [post.id]: true }));
    setToast("Ääni kirjattu");
    window.clearTimeout(likePost.toastTimer);
    likePost.toastTimer = window.setTimeout(() => setToast(""), 1100);

    if (post.bot) return;
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return;

    await supabase.from("votes").upsert({ post_id: post.id, user_id: userId, value: 1 }, { onConflict: "user_id,post_id" });
    supabase.rpc("record_ai_feed_signal", { target_post_id: post.id, event: "feed_like" });
  }

  const current = posts[activeIndex] || {};
  const currentLikes = Number(current.votes || current.vote_count || 0) + (likedPosts[current.id] ? 1 : 0);

  const hudData = {
    pot: formatEuro(kolehti.dailyPot),
    users: `${kolehti.groupSize}/${kolehti.groupMax || 10}`,
    joined: Boolean(likedPosts[current.id]),
    leader: posts[0]?.display_name || posts[0]?.username || "-",
    likes: currentLikes,
    ai: getScore(current),
    trending: isTrending(current, activeIndex),
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white" onClick={reveal}>
      <TopHUD visible={visible} data={hudData} pulseKey={pulseKey} onMenu={() => setMenuOpen(true)} />

      <main onScroll={handleScroll} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {posts.length === 0 && <EmptyState />}
        {posts.map((post, index) => (
          <FeedCard
            key={post.id}
            post={post}
            index={index}
            active={index === activeIndex}
            leader={index === 0}
            liked={Boolean(likedPosts[post.id])}
            onLike={() => likePost(post)}
          />
        ))}
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.96 }}
            className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] left-1/2 z-[65] -translate-x-1/2 rounded-full border border-emerald-200/20 bg-emerald-400/16 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-50 backdrop-blur-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheetMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} />
    </div>
  );
}

function EmptyState() {
  return (
    <section className="grid h-[100dvh] snap-start place-items-center bg-[#050816] px-6 text-center">
      <div className="rounded-[32px] border border-white/10 bg-white/6 p-8 backdrop-blur-xl">
        <div className="text-5xl">🔥</div>
        <h2 className="mt-4 text-3xl font-black">Feed on tyhjä</h2>
        <p className="mt-2 text-sm font-bold text-white/55">Luo ensimmäinen perustelu ja käynnistä päivän potti.</p>
      </div>
    </section>
  );
}

function FeedCard({ post, index, active, leader, liked, onLike }) {
  const media = getMedia(post);
  const author = post.bot ? post.bot_name : post.display_name || post.username || "Pelaaja";
  const avatar = post.bot ? post.bot_avatar || "🤖" : String(author).slice(0, 1).toUpperCase();
  const likes = Number(post.votes || post.vote_count || 0) + (liked ? 1 : 0);
  const ai = getScore(post);
  const trending = isTrending(post, index);

  return (
    <section className="relative h-[100dvh] snap-start overflow-hidden bg-[#050816]">
      <MediaLayer media={media} active={active} />
      <motion.div
        initial={false}
        animate={{ scale: active ? 1 : 1.025 }}
        transition={{ duration: 0.7 }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(34,211,238,.22),transparent_42%),radial-gradient(circle_at_82%_20%,rgba(244,114,182,.16),transparent_36%),linear-gradient(to_bottom,rgba(0,0,0,.45),rgba(0,0,0,.08)_34%,rgba(0,0,0,.92))]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/72 to-transparent" />

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+26px)] left-0 right-0 z-10 px-4">
        <motion.div
          initial={false}
          animate={{ y: active ? 0 : 22, opacity: active ? 1 : 0.75 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="rounded-[34px] border border-white/14 bg-black/42 p-5 shadow-2xl shadow-black/55 backdrop-blur-2xl"
        >
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
            {leader && <Badge tone="yellow">🏆 johtaja</Badge>}
            {trending && <Badge tone="pink">🔥 trendaa nyt</Badge>}
            <Badge tone="cyan">🧠 {ai}%</Badge>
            <Badge>❤️ {likes}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/18 bg-white/10 text-lg font-black shadow-xl shadow-black/30">{avatar}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-black tracking-tight">{author}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">{post.bot ? "AI-pelibotti" : "päivän perustelu"}</div>
            </div>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); onLike(); }}
              className={`grid h-13 min-h-13 w-13 min-w-13 place-items-center rounded-full border px-4 py-3 text-xl font-black shadow-xl transition active:scale-90 ${liked ? "border-pink-200/45 bg-pink-500/35 text-pink-50" : "border-white/14 bg-white/10 text-white"}`}
              aria-label="Tykkää tai äänestä"
            >
              ♥
            </button>
          </div>

          <p className="mt-5 text-[28px] font-black leading-[1.08] tracking-tight text-white drop-shadow-2xl sm:text-[34px]">{post.content}</p>

          <div className="mt-5 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-white/55">
            <span>{media.fallback ? "curated mood" : media.type}</span>
            <span>{leader ? "top position" : `#${index + 1}`}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MediaLayer({ media, active }) {
  const className = "absolute inset-0 h-full w-full object-cover opacity-86";
  if (media.type === "video" && media.url) {
    return <video src={media.url} className={className} autoPlay={active} muted loop playsInline preload={active ? "auto" : "metadata"} />;
  }
  return <img src={media.url} alt="" className={className} loading={active ? "eager" : "lazy"} decoding="async" />;
}

function Badge({ children, tone = "white" }) {
  const toneClass = tone === "yellow" ? "border-yellow-200/22 bg-yellow-300/12 text-yellow-100" : tone === "pink" ? "border-pink-200/22 bg-pink-400/12 text-pink-100" : tone === "cyan" ? "border-cyan-200/22 bg-cyan-300/12 text-cyan-100" : "border-white/10 bg-white/8 text-white/78";
  return <span className={`rounded-full border px-3 py-1 ${toneClass}`}>{children}</span>;
}
