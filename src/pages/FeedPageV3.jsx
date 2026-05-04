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
  return { url: url || BACKGROUNDS[stableIndex(post?.id || post?.content || "kolehti")], type: isVideo ? "video" : "image", fallback: !url };
}

function getScore(post) { return Math.round(post?.ai_score || post?.backend_score || post?.winner_score || post?.score || 0); }
function getVotes(post) { return Number(post?.votes || post?.vote_count || 0); }
function getViews(post) { return Number(post?.views || post?.watch_time_total || 0); }
function getShares(post) { return Number(post?.shares || post?.share_count || 0); }
function isTrending(post, index) { return index <= 2 && (getVotes(post) >= 5 || getScore(post) >= 75 || getViews(post) >= 40 || getShares(post) >= 2); }
function estimateReward(kolehti, streak, combo, activeIndex) { return Number(kolehti?.dailyPot || 0) * Math.min(2.5, 1 + streak * 0.03 + combo * 0.08 + (activeIndex === 0 ? 0.25 : 0)); }

function explainPost(post, index) {
  if (index === 0) return "Tämä johtaa päivän peliä: vahva sijainti, signaalit ja yleisön reaktiot nostavat sen kärkeen.";
  if (getShares(post) >= 2) return "Tämä saa jakosignaalia. Jaot nostavat perustelua, koska ne tuovat uusia pelaajia ja kasvattavat päivän pottia.";
  if (getScore(post) >= 75) return "AI arvioi tämän osuvaksi sinulle sisällön, samankaltaisten signaalien ja feed-käyttäytymisen perusteella.";
  if (getVotes(post) >= 5) return "Tämä saa nopeasti ääniä, joten se nostetaan näkyviin ennen kuin momentum jäähtyy.";
  if (post?.bot) return "Pelibotti pitää feedin käynnissä ja opettaa algoritmille, millaisiin perusteluihin reagoit.";
  return "Tämä näkyy, koska se tuo vaihtelua feediin ja auttaa KOLEHTIä oppimaan seuraavan parhaan perustelun.";
}

export default function FeedPageV3() {
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [sharedPosts, setSharedPosts] = useState({});
  const [aiBoosts, setAiBoosts] = useState({});
  const [toast, setToast] = useState("");
  const [sheet, setSheet] = useState(null);
  const [sheetPostId, setSheetPostId] = useState(null);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [aiMode, setAiMode] = useState("explore");
  const lastIndexRef = useRef(0);
  const toastTimerRef = useRef(null);

  const { visible, onScroll, reveal, trackLeader, pulseKey } = useFeedHUD();
  const kolehti = useMemo(() => calculateKolehtiPhase1(posts), [posts]);

  const rankedPosts = useMemo(() => [...posts].sort((a, b) => {
    const aScore = getScore(a) + (aiBoosts[a.id] || 0) + getVotes(a) * 1.8 + getShares(a) * 4;
    const bScore = getScore(b) + (aiBoosts[b.id] || 0) + getVotes(b) * 1.8 + getShares(b) * 4;
    return bScore - aScore;
  }), [posts, aiBoosts]);

  useEffect(() => { load(); return () => window.clearTimeout(toastTimerRef.current); }, []);
  useEffect(() => { if (rankedPosts.length) trackLeader(rankedPosts[0].id); }, [rankedPosts, trackLeader]);

  async function load() {
    const startupFeed = await supabase.rpc("get_kolehti_startup_feed", { match_count: 80 });
    if (!startupFeed.error && Array.isArray(startupFeed.data) && startupFeed.data.length) { setPosts(mergeWithBots(startupFeed.data, 6)); return; }
    const brainFeed = await supabase.rpc("match_ai_feed_brain_v2", { match_count: 80, exploration_rate: 0.14 });
    if (!brainFeed.error && Array.isArray(brainFeed.data) && brainFeed.data.length) { setPosts(mergeWithBots(brainFeed.data, 6)); return; }
    const aiFeed = await supabase.rpc("match_ai_feed", { match_count: 80 });
    if (!aiFeed.error && Array.isArray(aiFeed.data) && aiFeed.data.length) { setPosts(mergeWithBots(aiFeed.data, 6)); return; }
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(80);
    setPosts(rankGodFeed(mergeWithBots(data || [], 6)));
  }

  function notify(message) {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 1400);
  }

  function openSheet(name, postId = null) { setSheet(name); setSheetPostId(postId); }
  function closeSheet() { setSheet(null); setSheetPostId(null); }

  function handleScroll(event) {
    const height = window.innerHeight || 1;
    const index = Math.max(0, Math.min(Math.round(event.currentTarget.scrollTop / height), rankedPosts.length - 1));
    const previous = rankedPosts[lastIndexRef.current];
    if (index !== lastIndexRef.current && previous) {
      saveFeedSignal?.(previous, "skips");
      if (!previous.bot) supabase.rpc("record_ai_feed_signal", { target_post_id: previous.id, event: "feed_skip" });
      setAiBoosts((current) => ({ ...current, [previous.id]: (current[previous.id] || 0) - 8 }));
      setAiMode("adapt");
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
    setAiBoosts((current) => ({ ...current, [post.id]: (current[post.id] || 0) + 16 }));
    setAiMode("locked");
    setStreak((value) => value + 1);
    setCombo((value) => Math.min(value + 1, 5));
    notify(combo >= 2 ? `Combo x${Math.min(combo + 1, 5)} · ääni kirjattu` : "Ääni kirjattu");
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
    saveFeedSignal?.(post, "shares");
    setSharedPosts((current) => ({ ...current, [post.id]: true }));
    setAiBoosts((current) => ({ ...current, [post.id]: (current[post.id] || 0) + 24 }));
    setStreak((value) => value + 2);
    notify("Jako boostasi pottia");
    const text = `${post.content || "KOLEHTI"}\n\nTule mukaan KOLEHTI-pottiin.`;
    try { if (navigator.share) await navigator.share({ title: "KOLEHTI", text, url: window.location.href }); else await navigator.clipboard?.writeText(window.location.href); } catch {}
    if (!post.bot) supabase.rpc("record_ai_feed_signal", { target_post_id: post.id, event: "feed_share" });
    if (!post.bot) supabase.rpc("record_kolehti_user_memory", { target_post_id: post.id, event_name: "share", signal_weight: 2 });
  }

  const current = rankedPosts[activeIndex] || {};
  const currentLikes = getVotes(current) + (likedPosts[current.id] ? 1 : 0);
  const fillPercent = Math.max(6, Math.min(100, Number(kolehti.fillPercent || 0) + Object.keys(sharedPosts).length * 7 + streak));
  const isWinning = activeIndex === 0 && rankedPosts.length > 0;
  const rewardEstimate = estimateReward(kolehti, streak, combo, activeIndex);
  const selectedPost = rankedPosts.find((post) => post.id === sheetPostId) || current;

  const hudData = {
    pot: formatEuro(kolehti.dailyPot), users: `${kolehti.groupSize}/${kolehti.groupMax || 10}`, joined: Boolean(likedPosts[current.id]),
    leader: rankedPosts[0]?.display_name || rankedPosts[0]?.username || "-", likes: currentLikes,
    ai: Math.max(0, Math.min(99, getScore(current) + (aiBoosts[current.id] || 0))), trending: isTrending(current, activeIndex) || Boolean(sharedPosts[current.id]),
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white" onClick={reveal}>
      <TopHUD visible={visible} data={hudData} pulseKey={pulseKey} onMenu={() => setMenuOpen(true)} />
      <PotProgress visible={visible} percent={fillPercent} pot={formatEuro(kolehti.dailyPot)} streak={streak} combo={combo} winning={isWinning} reward={rewardEstimate} aiMode={aiMode} />
      <main onScroll={handleScroll} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rankedPosts.length === 0 && <EmptyState />}
        {rankedPosts.map((post, index) => (
          <FeedCard key={post.id} post={post} index={index} active={index === activeIndex} leader={index === 0} liked={Boolean(likedPosts[post.id])} shared={Boolean(sharedPosts[post.id])} boostedScore={aiBoosts[post.id] || 0} onLike={() => likePost(post)} onShare={() => sharePost(post)} onExplain={() => openSheet("explain", post.id)} onMoney={() => openSheet("money", post.id)} onGrowth={() => openSheet("growth", post.id)} onCreator={() => openSheet("creator", post.id)} />
        ))}
      </main>
      <AnimatePresence>
        {toast && <Toast message={toast} />}
        {sheet === "explain" && <ExplainSheet post={selectedPost} index={rankedPosts.findIndex((post) => post.id === selectedPost?.id)} boost={aiBoosts[selectedPost?.id] || 0} onClose={closeSheet} />}
        {sheet === "money" && <MoneySheet pot={formatEuro(kolehti.dailyPot)} reward={rewardEstimate} percent={fillPercent} streak={streak} combo={combo} onClose={closeSheet} />}
        {sheet === "growth" && <GrowthSheet shares={Object.keys(sharedPosts).length} onClose={closeSheet} />}
        {sheet === "creator" && <CreatorSheet post={selectedPost} position={rankedPosts.findIndex((post) => post.id === selectedPost?.id) + 1} likes={getVotes(selectedPost) + (likedPosts[selectedPost?.id] ? 1 : 0)} shares={getShares(selectedPost) + (sharedPosts[selectedPost?.id] ? 1 : 0)} ai={Math.max(0, Math.min(99, getScore(selectedPost) + (aiBoosts[selectedPost?.id] || 0)))} onClose={closeSheet} />}
      </AnimatePresence>
      <BottomSheetMenu open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }} />
    </div>
  );
}

function PotProgress({ visible, percent, pot, streak, combo, winning, reward, aiMode }) {
  return <motion.div initial={false} animate={{ y: visible ? 0 : -132, opacity: visible ? 1 : 0.9 }} transition={{ type: "spring", stiffness: 300, damping: 32 }} className="pointer-events-none fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+78px)] z-[55]"><div className="rounded-[22px] border border-white/10 bg-black/40 px-3 py-2 shadow-xl shadow-black/30 backdrop-blur-xl"><div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-white/70"><span>{winning ? "olet kärkinäkymässä" : "päivän potti"}</span><span>{pot} · est. {formatEuro(reward)}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-emerald-200 to-yellow-200" animate={{ width: `${percent}%` }} transition={{ duration: 0.45 }} /></div><div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-white/48"><span>streak {streak} · combo x{combo}</span><span>AI {aiMode}</span></div></div></motion.div>;
}

function EmptyState() { return <section className="grid h-[100dvh] snap-start place-items-center bg-[#050816] px-6 text-center"><div className="rounded-[32px] border border-white/10 bg-white/6 p-8 backdrop-blur-xl"><div className="text-5xl">🔥</div><h2 className="mt-4 text-3xl font-black">Feed on tyhjä</h2><p className="mt-2 text-sm font-bold text-white/55">Luo ensimmäinen perustelu ja käynnistä päivän potti.</p></div></section>; }

function FeedCard({ post, index, active, leader, liked, shared, boostedScore, onLike, onShare, onExplain, onMoney, onGrowth, onCreator }) {
  const media = getMedia(post); const author = post.bot ? post.bot_name : post.display_name || post.username || "Pelaaja"; const avatar = post.bot ? post.bot_avatar || "🤖" : String(author).slice(0, 1).toUpperCase(); const likes = getVotes(post) + (liked ? 1 : 0); const shares = getShares(post) + (shared ? 1 : 0); const ai = Math.max(0, Math.min(99, getScore(post) + boostedScore)); const trending = isTrending(post, index) || shared;
  return <section className="relative h-[100dvh] snap-start overflow-hidden bg-[#050816]"><MediaLayer media={media} active={active} /><motion.div initial={false} animate={{ scale: active ? 1 : 1.035, y: active ? 0 : 8 }} transition={{ duration: 0.7 }} className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(34,211,238,.22),transparent_42%),radial-gradient(circle_at_82%_20%,rgba(244,114,182,.16),transparent_36%),linear-gradient(to_bottom,rgba(0,0,0,.5),rgba(0,0,0,.08)_34%,rgba(0,0,0,.94))]" /><div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/72 to-transparent" /><div className="absolute bottom-[calc(env(safe-area-inset-bottom)+26px)] left-0 right-0 z-10 px-4"><motion.div initial={false} animate={{ y: active ? 0 : 26, opacity: active ? 1 : 0.7, scale: active ? 1 : 0.985 }} transition={{ type: "spring", stiffness: 220, damping: 26 }} className={`rounded-[34px] border p-5 shadow-2xl backdrop-blur-2xl ${leader ? "border-yellow-200/22 bg-yellow-950/24 shadow-yellow-500/10" : "border-white/14 bg-black/42 shadow-black/55"}`}><div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">{leader && <Badge tone="yellow">🏆 johtaja</Badge>}{trending && <Badge tone="pink">🔥 trendaa nyt</Badge>}{boostedScore > 0 && <Badge tone="green">⚡ AI boost +{boostedScore}</Badge>}<Badge tone="cyan">🧠 {ai}%</Badge><Badge>❤️ {likes}</Badge><Badge>↗ {shares}</Badge></div><div className="flex items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/18 bg-white/10 text-lg font-black shadow-xl shadow-black/30">{avatar}</div><div className="min-w-0 flex-1"><div className="truncate text-xl font-black tracking-tight">{author}</div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/55">{post.bot ? "AI-pelibotti" : "päivän perustelu"}</div></div><motion.button whileTap={{ scale: 0.86 }} type="button" onClick={(event) => { event.stopPropagation(); onLike(); }} className={`grid h-14 w-14 place-items-center rounded-full border text-2xl font-black shadow-xl transition ${liked ? "border-pink-200/45 bg-pink-500/35 text-pink-50" : "border-white/14 bg-white/10 text-white"}`} aria-label="Tykkää tai äänestä">♥</motion.button></div><p className="mt-5 text-[28px] font-black leading-[1.08] tracking-tight text-white drop-shadow-2xl sm:text-[34px]">{post.content}</p><div className="mt-5 grid grid-cols-4 gap-2 text-[10px] font-black uppercase tracking-[0.13em]"><ActionButton onClick={onExplain}>miksi</ActionButton><ActionButton onClick={onShare}>{shared ? "boosted" : "jaa"}</ActionButton><ActionButton onClick={onMoney}>raha</ActionButton><ActionButton onClick={onCreator}>creator</ActionButton></div><button type="button" onClick={(event) => { event.stopPropagation(); onGrowth(); }} className="mt-3 w-full rounded-2xl border border-yellow-200/14 bg-yellow-300/10 px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-100/84 transition active:scale-[0.99]">kutsu pelaajia · kasvata pottia · boostaa sijoitusta</button></motion.div></div></section>;
}

function ActionButton({ children, onClick }) { return <button type="button" onClick={(event) => { event.stopPropagation(); onClick?.(); }} className="rounded-2xl border border-white/10 bg-white/8 px-2 py-3 text-white/72 transition active:scale-95">{children}</button>; }
function MediaLayer({ media, active }) { const className = "absolute inset-0 h-full w-full object-cover opacity-90"; if (media.type === "video" && media.url) return <video src={media.url} className={className} autoPlay={active} muted loop playsInline preload={active ? "auto" : "metadata"} />; return <motion.img src={media.url} alt="" className={className} loading={active ? "eager" : "lazy"} decoding="async" animate={{ scale: active ? 1.02 : 1.08 }} transition={{ duration: 1.2 }} />; }

function ExplainSheet({ post, index, boost, onClose }) { if (!post) return null; return <Sheet onClose={onClose} label="AI domination layer" title="Miksi tämä näkyy?"><p className="text-sm font-bold leading-relaxed text-white/72">{explainPost(post, index)}</p><div className="mt-5 grid grid-cols-4 gap-2"><MiniStat label="AI" value={`${getScore(post)}%`} /><MiniStat label="Boost" value={`+${boost}`} /><MiniStat label="Äänet" value={getVotes(post)} /><MiniStat label="Jaot" value={getShares(post) || getViews(post)} /></div><div className="mt-5 rounded-2xl border border-cyan-100/12 bg-cyan-300/8 p-4 text-xs font-bold leading-relaxed text-cyan-50/75">AI oppii reaaliajassa: tykkäys nostaa samantyyppisiä perusteluja, skippi laskee vastaavia, jako antaa vahvimman kasvusignaalin.</div></Sheet>; }
function MoneySheet({ pot, reward, percent, streak, combo, onClose }) { return <Sheet onClose={onClose} label="money layer" title="Päivän ansainta"><div className="rounded-[26px] border border-yellow-200/16 bg-yellow-300/10 p-5 text-center"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-100/70">potentiaalinen arvo</div><div className="mt-2 text-4xl font-black text-yellow-50">{formatEuro(reward)}</div><div className="mt-1 text-xs font-bold text-yellow-50/60">potti {pot} · streak {streak} · combo x{combo}</div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-yellow-200 via-emerald-200 to-cyan-200" style={{ width: `${Math.min(100, percent)}%` }} /></div><p className="mt-4 text-sm font-bold leading-relaxed text-white/70">Raha-layer tekee etenemisestä näkyvän: jokainen ääni, combo ja kutsu kasvattaa osallistumisen tunnetta ennen varsinaista maksulogiikkaa.</p></Sheet>; }
function GrowthSheet({ shares, onClose }) { return <Sheet onClose={onClose} label="viral growth engine" title="Kasvata pottia"><div className="grid grid-cols-3 gap-2"><MiniStat label="Jaot" value={shares} /><MiniStat label="Boost" value={`+${shares * 24}`} /><MiniStat label="Loop" value="viral" /></div><div className="mt-5 space-y-3"><GrowthStep title="1. Jaa perustelu" text="Jako antaa vahvimman signaalin ja nostaa perustelun takaisin kilpailuun." /><GrowthStep title="2. Kutsu 3 pelaajaa" text="Potti tuntuu kasvavan, kun ryhmä täyttyy ja kilpailu kovenee." /><GrowthStep title="3. Palaa katsomaan sijoitus" text="Retention-loop syntyy, kun käyttäjä seuraa pottia, johtajaa ja omaa vaikutusta." /></div></Sheet>; }
function CreatorSheet({ post, position, likes, shares, ai, onClose }) { return <Sheet onClose={onClose} label="creator mode" title="Creator dashboard"><div className="grid grid-cols-4 gap-2"><MiniStat label="Sija" value={`#${position}`} /><MiniStat label="AI" value={`${ai}%`} /><MiniStat label="Äänet" value={likes} /><MiniStat label="Jaot" value={shares} /></div><p className="mt-5 text-sm font-bold leading-relaxed text-white/72">{post?.content ? `“${String(post.content).slice(0, 120)}${String(post.content).length > 120 ? "…" : "”"}` : "Tämä kortti kerää signaaleja reaaliaikaisesti."}</p><div className="mt-5 rounded-2xl border border-pink-100/12 bg-pink-300/8 p-4 text-xs font-bold leading-relaxed text-pink-50/75">Creator mode näyttää miksi oma sisältö kasvaa: sijoitus, AI-osuvuus, äänet ja jaot samassa paikassa.</div></Sheet>; }
function GrowthStep({ title, text }) { return <div className="rounded-2xl border border-white/10 bg-white/7 p-4"><div className="text-sm font-black text-white">{title}</div><div className="mt-1 text-xs font-bold leading-relaxed text-white/58">{text}</div></div>; }
function Sheet({ children, onClose, label, title }) { return <div className="fixed inset-0 z-[75] bg-black/55 backdrop-blur-sm" onClick={onClose}><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-white/10 bg-[#050816]/96 px-5 pb-[calc(env(safe-area-inset-bottom)+26px)] pt-3 text-white shadow-2xl shadow-black/70" onClick={(event) => event.stopPropagation()}><div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" /><div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/58">{label}</div><h3 className="mt-2 text-2xl font-black">{title}</h3><div className="mt-4">{children}</div><button type="button" onClick={onClose} className="mt-5 w-full rounded-2xl border border-white/10 bg-white/8 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition active:scale-[0.99]">Jatka feediä</button></motion.div></div>; }
function MiniStat({ label, value }) { return <div className="rounded-2xl border border-white/10 bg-white/7 px-2 py-4 text-center"><div className="text-lg font-black">{value}</div><div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{label}</div></div>; }
function Toast({ message }) { return <motion.div initial={{ y: 20, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 12, opacity: 0, scale: 0.96 }} className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] left-1/2 z-[65] -translate-x-1/2 rounded-full border border-emerald-200/20 bg-emerald-400/16 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-50 backdrop-blur-xl">{message}</motion.div>; }
function Badge({ children, tone = "white" }) { const toneClass = tone === "yellow" ? "border-yellow-200/22 bg-yellow-300/12 text-yellow-100" : tone === "pink" ? "border-pink-200/22 bg-pink-400/12 text-pink-100" : tone === "cyan" ? "border-cyan-200/22 bg-cyan-300/12 text-cyan-100" : tone === "green" ? "border-emerald-200/22 bg-emerald-300/12 text-emerald-100" : "border-white/10 bg-white/8 text-white/78"; return <span className={`rounded-full border px-3 py-1 ${toneClass}`}>{children}</span>; }
