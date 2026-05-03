import { useEffect, useMemo, useRef, useState } from "react";
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

function getVotes(post) {
  return Number(post?.votes || post?.vote_count || 0);
}

function getViews(post) {
  return Number(post?.views || post?.watch_time_total || 0);
}

function isTrending(post, index) {
  const votes = getVotes(post);
  const score = getScore(post);
  const views = getViews(post);
  return index <= 2 && (votes >= 5 || score >= 75 || views >= 40);
}

function explainPost(post, index) {
  const score = getScore(post);
  const votes = getVotes(post);
  if (index === 0) return "Tämä johtaa päivän peliä: vahva sijainti, signaalit ja yleisön reaktiot nostavat sen kärkeen.";
  if (score >= 75) return "AI arvioi tämän osuvaksi sinulle sisällön, samankaltaisten signaalien ja feed-käyttäytymisen perusteella.";
  if (votes >= 5) return "Tämä saa nopeasti ääniä, joten se nostetaan näkyviin ennen kuin momentum jäähtyy.";
  if (post?.bot) return "Pelibotti pitää feedin käynnissä ja opettaa algoritmille, millaisiin perusteluihin reagoit.";
  return "Tämä näkyy, koska se tuo vaihtelua feediin ja auttaa KOLEHTIä oppimaan seuraavan parhaan perustelun.";
}

export default function FeedPageV3() {
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [toast, setToast] = useState("");
  const [explainPostId, setExplainPostId] = useState(null);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const lastIndexRef = useRef(0);
  const toastTimerRef = useRef(null);

  const { visible, onScroll, reveal, trackLeader, pulseKey } = useFeedHUD();
  const kolehti = useMemo(() => calculateKolehtiPhase1(posts), [posts]);

  useEffect(() => { load(); return () => window.clearTimeout(toastTimerRef.current); }, []);
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

  function notify(message) {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 1200);
  }

  function handleScroll(event) {
    const height = window.innerHeight || 1;
    const index = Math.max(0, Math.min(Math.round(event.currentTarget.scrollTop / height), posts.length - 1));
    const previous = posts[lastIndexRef.current];

    if (index !== lastIndexRef.current && previous) {
      saveFeedSignal?.(previous, "skips");
      if (!previous.bot) supabase.rpc("record_ai_feed_signal", { target_post_id: previous.id, event: "feed_skip" });
      setCombo(1);
      lastIndexRef.current = index;
    }

    setActiveIndex(index);
    onScroll(event.currentTarget.scrollTop);
  }

  async function likePost(post) {
    if (!post?.id) return;
    haptic?.("heavy");
    saveFeedSignal?.(post, "likes");

    setLikedPosts((current) => ({ ...current, [post.id]: true }));
    setStreak((value) => value + 1);
    setCombo((value) => Math.min(value + 1, 5));
    notify(combo >= 2 ? `Combo x${Math.min(combo + 1, 5)} · ääni kirjattu` : "Ääni kirjattu");

    if (post.bot) return;
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return;

    await supabase.from("votes").upsert({ post_id: post.id, user_id: userId, value: 1 }, { onConflict: "user_id,post_id" });
    supabase.rpc("record_ai_feed_signal", { target_post_id: post.id, event: "feed_like" });
  }

  const current = posts[activeIndex] || {};
  const currentLikes = getVotes(current) + (likedPosts[current.id] ? 1 : 0);
  const fillPercent = Math.max(6, Math.min(100, Number(kolehti.fillPercent || 0)));
  const isWinning = activeIndex === 0 && posts.length > 0;

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
      <PotProgress visible={visible} percent={fillPercent} pot={formatEuro(kolehti.dailyPot)} streak={streak} combo={combo} winning={isWinning} />

      <main onScroll={handleScroll} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            onExplain={() => setExplainPostId(post.id)}
          />
        ))}
      </main>

      <AnimatePresence>
        {toast && <Toast message={toast} />}
        {explainPostId && (
          <ExplainSheet
            post={posts.find((post) => post.id === explainPostId)}
            index={posts.findIndex((post) => post.id === explainPostId)}
            onClose={() => setExplainPostId(null)}
          />
        )}
      </AnimatePresence>

      <BottomSheetMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} />
    </div>
  );
}

function PotProgress({ visible, percent, pot, streak, combo, winning }) {
  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : -112, opacity: visible ? 1 : 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="pointer-events-none fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+78px)] z-[55]"
    >
      <div className="rounded-[22px] border border-white/10 bg-black/40 px-3 py-2 shadow-xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-white/70">
          <span>{winning ? "olet kärkinäkymässä" : "päivän potti"}</span>
          <span>{pot}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-emerald-200 to-yellow-200" animate={{ width: `${percent}%` }} transition={{ duration: 0.45 }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-white/48">
          <span>streak {streak}</span>
          <span>combo x{combo}</span>
        </div>
      </div>
    </motion.div>
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

function FeedCard({ post, index, active, leader, liked, onLike, onExplain }) {
  const media = getMedia(post);
  const author = post.bot ? post.bot_name : post.display_name || post.username || "Pelaaja";
  const avatar = post.bot ? post.bot_avatar || "🤖" : String(author).slice(0, 1).toUpperCase();
  const likes = getVotes(post) + (liked ? 1 : 0);
  const ai = getScore(post);
  const trending = isTrending(post, index);

  return (
    <section className="relative h-[100dvh] snap-start overflow-hidden bg-[#050816]">
      <MediaLayer media={media} active={active} />
      <motion.div
        initial={false}
        animate={{ scale: active ? 1 : 1.035, y: active ? 0 : 8 }}
        transition={{ duration: 0.7 }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(34,211,238,.22),transparent_42%),radial-gradient(circle_at_82%_20%,rgba(244,114,182,.16),transparent_36%),linear-gradient(to_bottom,rgba(0,0,0,.5),rgba(0,0,0,.08)_34%,rgba(0,0,0,.94))]"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/72 to-transparent" />

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+26px)] left-0 right-0 z-10 px-4">
        <motion.div
          initial={false}
          animate={{ y: active ? 0 : 26, opacity: active ? 1 : 0.7, scale: active ? 1 : 0.985 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className={`rounded-[34px] border p-5 shadow-2xl backdrop-blur-2xl ${leader ? "border-yellow-200/22 bg-yellow-950/24 shadow-yellow-500/10" : "border-white/14 bg-black/42 shadow-black/55"}`}
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
            <motion.button
              whileTap={{ scale: 0.86 }}
              type="button"
              onClick={(event) => { event.stopPropagation(); onLike(); }}
              className={`grid h-14 w-14 place-items-center rounded-full border text-2xl font-black shadow-xl transition ${liked ? "border-pink-200/45 bg-pink-500/35 text-pink-50" : "border-white/14 bg-white/10 text-white"}`}
              aria-label="Tykkää tai äänestä"
            >
              ♥
            </motion.button>
          </div>

          <p className="mt-5 text-[28px] font-black leading-[1.08] tracking-tight text-white drop-shadow-2xl sm:text-[34px]">{post.content}</p>

          <div className="mt-5 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-white/55">
            <button type="button" onClick={(event) => { event.stopPropagation(); onExplain(); }} className="rounded-full border border-cyan-100/14 bg-cyan-300/10 px-3 py-2 text-cyan-100/80 transition active:scale-95">miksi tämä?</button>
            <span>{leader ? "top position" : `#${index + 1}`}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MediaLayer({ media, active }) {
  const className = "absolute inset-0 h-full w-full object-cover opacity-90";
  if (media.type === "video" && media.url) {
    return <video src={media.url} className={className} autoPlay={active} muted loop playsInline preload={active ? "auto" : "metadata"} />;
  }
  return <motion.img src={media.url} alt="" className={className} loading={active ? "eager" : "lazy"} decoding="async" animate={{ scale: active ? 1.02 : 1.08 }} transition={{ duration: 1.2 }} />;
}

function ExplainSheet({ post, index, onClose }) {
  if (!post) return null;
  const score = getScore(post);
  const votes = getVotes(post);
  const views = getViews(post);

  return (
    <div className="fixed inset-0 z-[75] bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-white/10 bg-[#050816]/96 px-5 pb-[calc(env(safe-area-inset-bottom)+26px)] pt-3 text-white shadow-2xl shadow-black/70"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/58">AI explain layer</div>
        <h3 className="mt-2 text-2xl font-black">Miksi tämä näkyy?</h3>
        <p className="mt-3 text-sm font-bold leading-relaxed text-white/72">{explainPost(post, index)}</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniStat label="AI" value={`${score}%`} />
          <MiniStat label="Äänet" value={votes} />
          <MiniStat label="Näytöt" value={views} />
        </div>
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl border border-white/10 bg-white/8 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition active:scale-[0.99]">Jatka feediä</button>
      </motion.div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/7 px-3 py-4 text-center"><div className="text-xl font-black">{value}</div><div className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">{label}</div></div>;
}

function Toast({ message }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 12, opacity: 0, scale: 0.96 }}
      className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] left-1/2 z-[65] -translate-x-1/2 rounded-full border border-emerald-200/20 bg-emerald-400/16 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-50 backdrop-blur-xl"
    >
      {message}
    </motion.div>
  );
}

function Badge({ children, tone = "white" }) {
  const toneClass = tone === "yellow" ? "border-yellow-200/22 bg-yellow-300/12 text-yellow-100" : tone === "pink" ? "border-pink-200/22 bg-pink-400/12 text-pink-100" : tone === "cyan" ? "border-cyan-200/22 bg-cyan-300/12 text-cyan-100" : "border-white/10 bg-white/8 text-white/78";
  return <span className={`rounded-full border px-3 py-1 ${toneClass}`}>{children}</span>;
}
