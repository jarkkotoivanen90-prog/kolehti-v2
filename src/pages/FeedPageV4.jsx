import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  return { url: url || BACKGROUNDS[stableIndex(post?.id || post?.content || "kolehti")], type: isVideo ? "video" : "image" };
}

function getScore(post) { return Math.round(post?.support_score || post?.ai_score || post?.backend_score || post?.winner_score || post?.score || 0); }
function getVotes(post) { return Number(post?.votes || post?.vote_count || 0); }
function getViews(post) { return Number(post?.views || post?.watch_time_total || 0); }
function getShares(post) { return Number(post?.shares || post?.share_count || 0); }

export default function FeedPageV4() {
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uiOpen, setUiOpen] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [sharedPosts, setSharedPosts] = useState({});
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState(null);
  const lastIndexRef = useRef(0);
  const uiTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const { visible, onScroll, reveal, trackLeader, pulseKey } = useFeedHUD();
  const kolehti = useMemo(() => calculateKolehtiPhase1(posts), [posts]);

  useEffect(() => {
    load();
    return () => {
      window.clearTimeout(uiTimerRef.current);
      window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => { if (posts.length) trackLeader(posts[0].id); }, [posts, trackLeader]);

  async function load() {
    const startupFeed = await supabase.rpc("get_kolehti_startup_feed", { match_count: 80 });
    if (!startupFeed.error && Array.isArray(startupFeed.data) && startupFeed.data.length) {
      setPosts(mergeWithBots(startupFeed.data, 6));
      return;
    }
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

  function revealUI() {
    reveal();
    setUiOpen(true);
    window.clearTimeout(uiTimerRef.current);
    uiTimerRef.current = window.setTimeout(() => setUiOpen(false), 2800);
  }

  function notify(message) {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 1300);
  }

  function handleScroll(event) {
    setUiOpen(false);
    const height = window.innerHeight || 1;
    const next = Math.max(0, Math.min(Math.round(event.currentTarget.scrollTop / height), posts.length - 1));
    const previous = posts[lastIndexRef.current];
    if (next !== lastIndexRef.current && previous) {
      saveFeedSignal?.(previous, "skips");
      if (!previous.bot) supabase.rpc("record_ai_feed_signal", { target_post_id: previous.id, event: "feed_skip" });
      lastIndexRef.current = next;
    }
    setActiveIndex(next);
    onScroll(event.currentTarget.scrollTop);
  }

  async function likePost(post) {
    if (!post?.id) return;
    haptic?.("heavy");
    saveFeedSignal?.(post, "likes");
    setLikedPosts((current) => ({ ...current, [post.id]: true }));
    notify("Ääni kirjattu");
    if (post.bot) return;
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return;
    await supabase.from("votes").upsert({ post_id: post.id, user_id: userId, value: 1 }, { onConflict: "user_id,post_id" });
    supabase.rpc("record_ai_feed_signal", { target_post_id: post.id, event: "feed_like" });
    supabase.rpc("record_kolehti_user_memory", { target_post_id: post.id, event_name: "like", signal_weight: 1 });
  }

  async function sharePost(post) {
    if (!post?.id) return;
    haptic?.("tap");
    setSharedPosts((current) => ({ ...current, [post.id]: true }));
    notify("Jako boostasi perustelua");
    const text = `${post.content || "KOLEHTI"}\n\nTule mukaan KOLEHTI-pottiin.`;
    try { if (navigator.share) await navigator.share({ title: "KOLEHTI", text, url: window.location.href }); else await navigator.clipboard?.writeText(window.location.href); } catch {}
    if (!post.bot) supabase.rpc("record_kolehti_user_memory", { target_post_id: post.id, event_name: "share", signal_weight: 2 });
  }

  const current = posts[activeIndex] || {};
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
    <div className="h-[100dvh] overflow-hidden bg-black text-white" onClick={revealUI}>
      <TopHUD visible={visible} data={hudData} pulseKey={pulseKey} onMenu={() => setMenuOpen(true)} />

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
            shared={Boolean(sharedPosts[post.id])}
            onLike={() => likePost(post)}
            onShare={() => sharePost(post)}
            onExplain={() => setSheet({ type: "explain", post })}
            onMoney={() => setSheet({ type: "money", post })}
          />
        ))}
      </main>

      <ContextBar visible={uiOpen} pot={formatEuro(kolehti.dailyPot)} group={`${kolehti.groupSize}/${kolehti.groupMax || 1500}`} onPot={() => setSheet({ type: "money", post: current })} />

      <AnimatePresence>
        {toast && <Toast message={toast} />}
        {sheet?.type === "explain" && <InfoSheet title="Miksi tämä näkyy?" label="AI" onClose={() => setSheet(null)}><p className="text-sm font-bold leading-relaxed text-white/72">{sheet.post?.rank_reason || "Tämä perustelu näkyy yhteisön signaalien, AI-arvion ja feedin vaihtelun perusteella."}</p><Stats post={sheet.post} /></InfoSheet>}
        {sheet?.type === "money" && <InfoSheet title="Päivän potti" label="Raha" onClose={() => setSheet(null)}><p className="text-sm font-bold leading-relaxed text-white/72">Potti on piilotettu selaamisen ajaksi, jotta feedi pysyy puhtaana. Avaa alapalkista, kun haluat katsoa tilanteen.</p><div className="mt-5 rounded-3xl border border-yellow-200/18 bg-yellow-300/10 p-5 text-center text-4xl font-black text-yellow-50">{formatEuro(kolehti.dailyPot)}</div></InfoSheet>}
      </AnimatePresence>

      <BottomSheetMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} />
    </div>
  );
}

function FeedCard({ post, index, active, leader, liked, shared, onLike, onShare, onExplain, onMoney }) {
  const media = getMedia(post);
  const author = post.bot ? post.bot_name : post.display_name || post.username || "Pelaaja";
  const avatar = post.bot ? post.bot_avatar || "🤖" : String(author).slice(0, 1).toUpperCase();
  const likes = getVotes(post) + (liked ? 1 : 0);
  const shares = getShares(post) + (shared ? 1 : 0);
  const ai = Math.max(0, Math.min(99, getScore(post)));

  return (
    <section className="relative h-[100dvh] snap-start overflow-hidden bg-[#050816]">
      <MediaLayer media={media} active={active} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.22),rgba(0,0,0,.08)_34%,rgba(0,0,0,.8)),radial-gradient(circle_at_28%_18%,rgba(34,211,238,.16),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/50 to-transparent" />

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+88px)] left-0 right-0 z-10 px-4">
        <motion.div initial={false} animate={{ y: active ? 0 : 24, opacity: active ? 1 : 0.7 }} transition={{ type: "spring", stiffness: 220, damping: 26 }} className="rounded-[34px] border border-white/10 bg-black/18 p-5 shadow-2xl shadow-black/35 backdrop-blur-[6px]">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
            {leader && <Badge tone="yellow">🏆 johtaja</Badge>}
            <Badge tone="cyan">🧠 {ai}%</Badge>
            <Badge>❤️ {likes}</Badge>
            <Badge>↗ {shares}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/14 bg-white/10 text-lg font-black shadow-xl shadow-black/30">{avatar}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-black tracking-tight">{author}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">{post.bot ? "AI-pelibotti" : `#${index + 1} päivän perustelu`}</div>
            </div>
            <motion.button whileTap={{ scale: 0.86 }} type="button" onClick={(event) => { event.stopPropagation(); onLike(); }} className={`grid h-13 w-13 place-items-center rounded-full border px-4 py-3 text-xl font-black shadow-xl transition ${liked ? "border-pink-200/45 bg-pink-500/35 text-pink-50" : "border-white/14 bg-white/10 text-white"}`} aria-label="Tykkää tai äänestä">♥</motion.button>
          </div>

          <p className="mt-5 text-[clamp(2.15rem,8vw,4.15rem)] font-black leading-[1.05] tracking-tight text-white drop-shadow-2xl">{post.content}</p>

          <div className="mt-5 grid grid-cols-4 gap-2 text-[10px] font-black uppercase tracking-[0.13em]">
            <ActionButton onClick={onExplain}>miksi</ActionButton>
            <ActionButton onClick={onShare}>{shared ? "jaettu" : "jaa"}</ActionButton>
            <ActionButton onClick={onMoney}>potti</ActionButton>
            <ActionButton onClick={onLike}>äänestä</ActionButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ContextBar({ visible, pot, group, onPot }) {
  return (
    <motion.nav initial={false} animate={{ y: visible ? 0 : 92, opacity: visible ? 1 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+14px)] z-[58] rounded-[28px] border border-white/12 bg-[#050816]/76 px-3 py-2 shadow-2xl shadow-black/45 backdrop-blur-2xl">
      <div className="grid grid-cols-5 gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-white/76">
        <Link to="/feed" className="rounded-2xl bg-white/8 px-2 py-3 text-center">Feed</Link>
        <Link to="/new" className="rounded-2xl bg-white/8 px-2 py-3 text-center">Uusi</Link>
        <button type="button" onClick={(e) => { e.stopPropagation(); onPot?.(); }} className="rounded-2xl bg-yellow-300/14 px-2 py-3 text-center text-yellow-100">{pot}</button>
        <Link to="/leaderboard" className="rounded-2xl bg-white/8 px-2 py-3 text-center">Top</Link>
        <Link to="/profile" className="rounded-2xl bg-white/8 px-2 py-3 text-center">Minä</Link>
      </div>
      <div className="mt-2 text-center text-[9px] font-black uppercase tracking-[0.18em] text-white/38">Porukka {group} · napauta feediä avataksesi palkin</div>
    </motion.nav>
  );
}

function MediaLayer({ media, active }) {
  const className = "absolute inset-0 h-full w-full object-cover opacity-95";
  if (media.type === "video" && media.url) return <video src={media.url} className={className} autoPlay={active} muted loop playsInline preload={active ? "auto" : "metadata"} />;
  return <motion.img src={media.url} alt="" className={className} loading={active ? "eager" : "lazy"} decoding="async" animate={{ scale: active ? 1.02 : 1.08 }} transition={{ duration: 1.2 }} />;
}

function InfoSheet({ children, onClose, label, title }) {
  return <div className="fixed inset-0 z-[75] bg-black/55 backdrop-blur-sm" onClick={onClose}><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-white/10 bg-[#050816]/96 px-5 pb-[calc(env(safe-area-inset-bottom)+26px)] pt-3 text-white shadow-2xl shadow-black/70" onClick={(event) => event.stopPropagation()}><div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" /><div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/58">{label}</div><h3 className="mt-2 text-2xl font-black">{title}</h3><div className="mt-4">{children}</div><button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl border border-white/10 bg-white/8 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition active:scale-[0.99]">Jatka feediä</button></motion.div></div>;
}

function Stats({ post }) {
  return <div className="mt-5 grid grid-cols-3 gap-2"><MiniStat label="AI" value={`${getScore(post)}%`} /><MiniStat label="Äänet" value={getVotes(post)} /><MiniStat label="Näytöt" value={getViews(post)} /></div>;
}
function EmptyState() { return <section className="grid h-[100dvh] snap-start place-items-center bg-[#050816] px-6 text-center"><div className="rounded-[32px] border border-white/10 bg-white/6 p-8 backdrop-blur-xl"><div className="text-5xl">🔥</div><h2 className="mt-4 text-3xl font-black">Feed on tyhjä</h2><p className="mt-2 text-sm font-bold text-white/55">Luo ensimmäinen perustelu ja käynnistä päivän potti.</p></div></section>; }
function ActionButton({ children, onClick }) { return <button type="button" onClick={(event) => { event.stopPropagation(); onClick?.(); }} className="rounded-2xl border border-white/10 bg-white/8 px-2 py-3 text-white/72 transition active:scale-95">{children}</button>; }
function MiniStat({ label, value }) { return <div className="rounded-2xl border border-white/10 bg-white/7 px-2 py-4 text-center"><div className="text-lg font-black">{value}</div><div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{label}</div></div>; }
function Toast({ message }) { return <motion.div initial={{ y: 20, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 12, opacity: 0, scale: 0.96 }} className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+100px)] left-1/2 z-[65] -translate-x-1/2 rounded-full border border-emerald-200/20 bg-emerald-400/16 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-50 backdrop-blur-xl">{message}</motion.div>; }
function Badge({ children, tone = "white" }) { const toneClass = tone === "yellow" ? "border-yellow-200/22 bg-yellow-300/12 text-yellow-100" : tone === "cyan" ? "border-cyan-200/22 bg-cyan-300/12 text-cyan-100" : "border-white/10 bg-white/8 text-white/78"; return <span className={`rounded-full border px-3 py-1 ${toneClass}`}>{children}</span>; }
