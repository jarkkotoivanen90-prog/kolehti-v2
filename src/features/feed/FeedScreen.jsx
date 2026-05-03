import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { mergeWithBots } from "../../lib/bots";
import { rankGodFeed, saveFeedSignal } from "../../lib/godFeed";
import { haptic } from "../../lib/effects";
import { calculateKolehtiPhase1, formatEuro } from "../../lib/kolehtiPhase1";
import TopHUD from "../../components/TopHUD";
import BottomSheetMenu from "../../components/BottomSheetMenu";
import AppBottomNav from "../../components/AppBottomNav";
import { useFeedHUD } from "../../hooks/useFeedHUD";
import FeedCard from "./FeedCard";
import { getScore, getVotes, getViews, getShares } from "./utils/feedFormatters";

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [sharedPosts, setSharedPosts] = useState({});
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState(null);
  const lastIndexRef = useRef(0);
  const toastTimerRef = useRef(null);
  const { visible, onScroll, reveal, trackLeader, pulseKey } = useFeedHUD();
  const kolehti = useMemo(() => calculateKolehtiPhase1(posts), [posts]);

  useEffect(() => {
    load();
    return () => window.clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    if (posts.length) trackLeader(posts[0].id);
  }, [posts, trackLeader]);

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

  function notify(message) {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 1300);
  }

  function handleScroll(event) {
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

    try {
      const text = `${post.content || "KOLEHTI"}\n\nTule mukaan KOLEHTI-pottiin.`;
      if (navigator.share) await navigator.share({ title: "KOLEHTI", text, url: window.location.href });
      else await navigator.clipboard?.writeText(window.location.href);
    } catch {}

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
    <div className="h-[100dvh] overflow-hidden bg-black text-white" onClick={reveal}>
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
            onMoney={() => setSheet({ type: "money", post: current })}
          />
        ))}
      </main>

      <AppBottomNav floating gesture />

      <AnimatePresence>
        {toast && <Toast message={toast} />}
        {sheet?.type === "explain" && (
          <InfoSheet title="Miksi tämä näkyy?" label="AI" onClose={() => setSheet(null)}>
            <p className="text-sm font-bold leading-relaxed text-white/72">{sheet.post?.rank_reason || "Tämä perustelu näkyy yhteisön signaalien, AI-arvion ja feedin vaihtelun perusteella."}</p>
            <Stats post={sheet.post} />
          </InfoSheet>
        )}
        {sheet?.type === "money" && (
          <InfoSheet title="Päivän potti" label="Raha" onClose={() => setSheet(null)}>
            <div className="rounded-3xl border border-yellow-200/18 bg-yellow-300/10 p-5 text-center text-4xl font-black text-yellow-50">{formatEuro(kolehti.dailyPot)}</div>
          </InfoSheet>
        )}
      </AnimatePresence>

      <BottomSheetMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} />
    </div>
  );
}

function Stats({ post }) {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2">
      <MiniStat label="AI" value={`${getScore(post)}%`} />
      <MiniStat label="Äänet" value={getVotes(post)} />
      <MiniStat label="Näytöt" value={getViews(post)} />
    </div>
  );
}

function InfoSheet({ children, onClose, label, title }) {
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
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/58">{label}</div>
        <h3 className="mt-2 text-2xl font-black">{title}</h3>
        <div className="mt-4">{children}</div>
        <button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl border border-white/10 bg-white/8 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition active:scale-[0.99]">Jatka feediä</button>
      </motion.div>
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

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 px-2 py-4 text-center">
      <div className="text-lg font-black">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{label}</div>
    </div>
  );
}

function Toast({ message }) {
  return <motion.div initial={{ y: 20, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 12, opacity: 0, scale: 0.96 }} className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+100px)] left-1/2 z-[65] -translate-x-1/2 rounded-full border border-emerald-200/20 bg-emerald-400/16 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-50 backdrop-blur-xl">{message}</motion.div>;
}
