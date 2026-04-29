import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { calculateLivePot, calculateInteractionXp, rankKolehtiFeed } from "../lib/kolehtiEngine";

function normalizePost(post, voteCount = 0) {
  if (!post || typeof post !== "object") return null;
  const id = post.id || post.post_id;
  const content = String(post.content || post.text || post.body || "").trim();
  if (!id || !content) return null;
  return {
    ...post,
    id,
    content,
    user_id: post.user_id || "unknown-user",
    group_id: post.group_id || null,
    created_at: post.created_at || new Date().toISOString(),
    votes: Number(post.votes || post.vote_count || voteCount || 0),
    vote_count: Number(post.vote_count || post.votes || voteCount || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
    views: Number(post.views || 1),
    image_url: post.image_url || post.photo_url || null,
  };
}

function sanitizePosts(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((post) => normalizePost(post, post?.vote_count || post?.votes || 0))
    .filter(Boolean)
    .filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
}

function scoreForMode(post, mode = "balanced") {
  const p = normalizePost(post);
  if (!p) return 0;
  const votes = Number(p.vote_count || p.votes || 0);
  const ai = Number(p.ai_score || 0);
  const growth = Number(p.growth_score || 0);
  const boost = Number(p.boost_score || 0);
  const engine = Number(p.kolehti_score || 0);
  if (mode === "skimmer") return growth * 1.45 + votes * 7 + boost * 1.2 + engine;
  if (mode === "reader") return ai * 1.55 + engine + votes * 3;
  return engine + ai + growth + votes * 4 + boost;
}

function buildMotivation({ post, index, posts, likeXp }) {
  const p = normalizePost(post);
  if (!p) return { headline: "", detail: "", tone: "cyan" };
  const votes = Number(p.vote_count || p.votes || 0);
  const prev = index > 0 ? normalizePost(posts[index - 1]) : null;
  const next = index < posts.length - 1 ? normalizePost(posts[index + 1]) : null;
  const gapUp = prev ? Math.max(1, Number(prev.vote_count || prev.votes || 0) - votes + 1) : 0;
  const gapDown = next ? Math.max(0, votes - Number(next.vote_count || next.votes || 0)) : 0;

  if (p.is_starter) return { headline: "✨ Mallikortti", detail: "Luo oma perustelu ja pääset oikeaan kilpailuun.", tone: "cyan" };
  if (index === 0) return { headline: "👑 Kärjessä nyt", detail: gapDown > 0 ? `${gapDown} äänen johto seuraavaan.` : "Johto on todella tiukka.", tone: "gold" };
  if (gapUp <= 2) return { headline: "🎯 Lähes nousu", detail: `🔥 ${gapUp} ääni${gapUp === 1 ? "" : "tä"} → ohitat ${Math.min(3, index)} pelaajaa`, tone: "pink" };
  if (likeXp.strongLikesLeft <= 3) return { headline: "⚡ Viimeiset strong liket", detail: `${likeXp.strongLikesLeft} jäljellä → tämä voi ratkaista rankingin`, tone: "orange" };
  return { headline: "🔥 Ranking pressure", detail: `Sija #${index + 1}. Seuraava nousu vaatii ${gapUp} ääntä.`, tone: "cyan" };
}

const starterPosts = [
  normalizePost({ id: "starter-1", content: "Kirjoita oma perustelu ja kerää ääniä. Hyvä perustelu on selkeä, aito ja sellainen jota muut haluavat tukea.", user_id: "starter", vote_count: 5, ai_score: 70, growth_score: 70, is_starter: true }),
  normalizePost({ id: "starter-2", content: "Kun yksi ihminen saa apua oikealla hetkellä, koko porukka vahvistuu.", user_id: "starter", vote_count: 3, ai_score: 65, growth_score: 65, is_starter: true }),
].filter(Boolean);

function rankBadge(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return index + 1;
}

function BottomNav({ hidden }) {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[30px] border border-cyan-300/10 bg-[#071328]/95 px-4 pb-4 pt-3 text-white shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out ${hidden ? "translate-y-full" : "translate-y-0"}`}>
      <div className="grid grid-cols-5 items-end text-center text-[11px] font-black">
        <Link to="/" className="text-white/75">🏠<div>Koti</div></Link>
        <Link to="/feed" className="text-cyan-300">🔥<div>Feed</div></Link>
        <Link to="/new" className="-mt-9"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-5xl shadow-2xl shadow-blue-500/40">+</div><div>Uusi</div></Link>
        <Link to="/pots" className="text-white/75">🏆<div>Potit</div></Link>
        <Link to="/profile" className="text-white/75">👤<div>Profiili</div></Link>
      </div>
    </nav>
  );
}

function RewardBurst({ reward }) {
  if (!reward) return null;
  return (
    <div key={reward.id} className="pointer-events-none fixed inset-x-0 top-[34%] z-[80] mx-auto max-w-sm px-6 text-center">
      <div className="animate-bounce rounded-[34px] border border-yellow-300/30 bg-black/65 px-5 py-5 text-white shadow-2xl shadow-yellow-400/20 backdrop-blur-2xl">
        <div className="text-6xl">{reward.emoji}</div>
        <div className="mt-2 text-2xl font-black leading-tight">{reward.title}</div>
        <div className="mt-1 text-sm font-bold text-white/65">{reward.text}</div>
      </div>
    </div>
  );
}

function FeedLiveTicker({ activity, hidden }) {
  if (!activity.length || hidden) return null;
  return (
    <section className="fixed left-1/2 top-24 z-[55] w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[24px] border border-cyan-300/20 bg-cyan-500/10 p-3 shadow-2xl backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-wide text-cyan-100">Live feed</p><span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /></div>
      <div className="space-y-1">{activity.slice(0, 2).map((item) => <div key={item.id} className="rounded-2xl bg-black/20 px-3 py-2 text-[11px] font-black text-white/75">{item.text}</div>)}</div>
    </section>
  );
}

function PotHero({ livePot, likeXp, behaviorMode }) {
  return (
    <section className="overflow-hidden rounded-[34px] border border-yellow-300/30 bg-gradient-to-br from-yellow-300/10 via-black/30 to-pink-500/10 p-[2px] shadow-2xl">
      <div className="rounded-[32px] bg-[#050816]/95 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-yellow-200">🔥 Päivän kierros</p>
        <p className="mt-1 text-5xl font-black">{livePot.amount} €</p>
        <p className="mt-2 text-xs font-black text-white/55">{Math.round(livePot.fillRate)}% täynnä · {livePot.missingPlayers} paikkaa jäljellä</p>
        <p className="mt-1 text-xs font-black text-cyan-200">⚡ Strong liket: {likeXp.strongLikesLeft} — käytä viisaasti</p>
        <p className="mt-1 text-xs font-black text-pink-200">🧠 AI mode: {behaviorMode}</p>
        <Link to="/pots" className="mt-5 block rounded-[22px] bg-yellow-300 px-5 py-4 text-center text-sm font-black text-black shadow-xl shadow-yellow-300/20">Katso pottien tilanne</Link>
      </div>
    </section>
  );
}

function MotivationStrip({ motivation }) {
  const color = motivation.tone === "gold" ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-50" : motivation.tone === "pink" ? "border-pink-300/30 bg-pink-500/10 text-pink-50" : motivation.tone === "orange" ? "border-orange-300/30 bg-orange-500/10 text-orange-50" : "border-cyan-300/30 bg-cyan-500/10 text-cyan-50";
  return <div className={`mt-5 rounded-[24px] border px-4 py-4 text-sm font-black leading-snug ${color}`}><div>{motivation.headline}</div><div className="mt-1 text-xs opacity-75">{motivation.detail}</div></div>;
}

function PostCard({ post, index, posts, voted, onVote, likeXp, active, dragging, preloaded }) {
  const safePost = normalizePost(post);
  if (!safePost) return null;
  const votes = Number(safePost.vote_count || safePost.votes || 0);
  const score = Math.round(Number(safePost.kolehti_score || safePost.ai_score || 0));
  const momentum = Math.round(Math.min(99, votes * 9 + Number(safePost.boost_score || 0)));
  const top = index === 0;
  const motivation = buildMotivation({ post: safePost, index, posts, likeXp });

  return (
    <article className={`relative w-full overflow-hidden rounded-[36px] border p-[2px] shadow-2xl transition-all duration-300 ${active ? "scale-100 opacity-100" : "scale-[0.965] opacity-70"} ${dragging && active ? "scale-[0.985]" : ""} ${top ? "border-yellow-300/60 bg-gradient-to-br from-yellow-300 via-pink-500 to-cyan-300" : "border-cyan-300/25 bg-gradient-to-br from-cyan-300/40 via-white/10 to-pink-400/30"}`}>
      <div className="absolute inset-0 opacity-25 blur-3xl bg-[radial-gradient(circle_at_top_left,#22d3ee,transparent_35%),radial-gradient(circle_at_bottom_right,#ec4899,transparent_35%)]" />
      {preloaded && !active && <div className="absolute right-4 top-4 z-20 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black text-cyan-100 backdrop-blur-xl">PRELOADED</div>}
      <div className="relative max-h-[calc(100dvh-145px)] overflow-y-auto rounded-[34px] bg-[#111827]/95 p-5 backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-[28px] border border-white/15 bg-gradient-to-br from-cyan-400/30 to-pink-500/30 shadow-xl">
            <div className="absolute -left-3 -top-3 grid h-12 w-12 place-items-center rounded-full bg-yellow-300 text-xl font-black text-black shadow-xl">{rankBadge(index)}</div>
            <div className="text-5xl">{safePost.is_starter ? "✨" : "💙"}</div>
            <div className="absolute bottom-2 left-2 right-2 h-2 rounded-full bg-cyan-300/80" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
            <div className="rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-2 text-xs font-black text-cyan-100">🤖 AI MALLI</div>
            <div className="grid w-full grid-cols-2 gap-2 text-center text-xs font-black">
              <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">SCORE</div><div className="mt-1 text-2xl text-cyan-200">{score}</div></div>
              <div className="rounded-2xl bg-yellow-300/15 p-3"><div className="text-yellow-100/60">MOMENTUM</div><div className="mt-1 text-2xl text-yellow-200">{momentum}</div></div>
            </div>
          </div>
        </div>
        <MotivationStrip motivation={motivation} />
        <div className="mt-5"><p className="text-xs font-black uppercase tracking-wide text-white/45">Perustelu</p><h2 className="mt-2 text-3xl font-black leading-tight text-white">{safePost.is_starter ? "Malliperustelu" : "Pelaajan perustelu"}</h2><p className="mt-4 whitespace-pre-wrap break-words text-xl font-black leading-relaxed text-white/85">{safePost.content}</p></div>
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-black">
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">ÄÄNET</div><div className="mt-1 text-2xl">{votes}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">VIRAL</div><div className="mt-1 text-2xl text-pink-300">{Math.min(99, votes * 7 + score)}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">SIJA</div><div className="mt-1 text-2xl">#{index + 1}</div></div>
        </div>
        <button type="button" onClick={() => onVote(safePost)} disabled={Boolean(voted) || Boolean(safePost.is_starter)} className="mt-6 w-full rounded-[26px] bg-cyan-500 px-5 py-5 text-xl font-black text-white shadow-2xl shadow-cyan-500/25 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40">
          {safePost.is_starter ? "Luo oma perustelu" : voted ? "Äänestetty" : `Tykkää +${likeXp.xp} XP`}
        </button>
      </div>
    </article>
  );
}

export default function FeedPageStable() {
  const scrollerRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const touchRef = useRef({ startY: 0, lastY: 0, startTime: 0 });
  const activeStartedAtRef = useRef(Date.now());
  const preloadRef = useRef({});
  const lastRewardTypeRef = useRef(null);
  const behaviorRef = useRef({ fast: 0, slow: 0, reorderAt: 0, rewardAt: 0, eventAt: 0 });
  const previousLeaderRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [voted, setVoted] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [uiHidden, setUiHidden] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [preloaded, setPreloaded] = useState({});
  const [behaviorMode, setBehaviorMode] = useState("balanced");
  const [reward, setReward] = useState(null);
  const [activity, setActivity] = useState([]);

  const safePosts = useMemo(() => {
    const real = sanitizePosts(posts);
    return real.length ? real : starterPosts;
  }, [posts]);

  const activePlayers = Math.max(1, safePosts.filter((p) => !p.is_starter).length * 120);
  const livePot = calculateLivePot({ activePlayers, invitedPlayers: 25 });
  const likeXp = calculateInteractionXp({ action: "like", strongLikesUsed: 2, groupSize: activePlayers });

  function pushFeedEvent(type, emoji, text, force = false) {
    const now = Date.now();
    if (!force && now - behaviorRef.current.eventAt < 4200) return;
    behaviorRef.current.eventAt = now;
    setActivity((prev) => [{ id: `${now}-${Math.random()}`, text: `${emoji} ${text}` }, ...prev.slice(0, 4)]);
    navigator.vibrate?.([8, 18, 8]);
  }

  useEffect(() => {
    loadFeed();
    const channel = supabase
      .channel("feed-dopamine-v3")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => { pushFeedEvent("post", "📝", "Uusi perustelu feedissä", true); loadFeed(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => { pushFeedEvent("vote", "💗", "Uusi ääni muutti rankingia", true); loadFeed(); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    const leader = safePosts.find((post) => !post.is_starter);
    if (!leader) return;
    if (previousLeaderRef.current && previousLeaderRef.current !== leader.id) {
      triggerReward("leaderChange", "🔥", "Johtaja vaihtui", "Feedin kärki muuttui juuri.");
      pushFeedEvent("leader", "🔥", "Johtaja vaihtui feedissä", true);
    }
    previousLeaderRef.current = leader.id;
  }, [safePosts]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    let ticking = false;
    function updateActive() {
      const cards = Array.from(root.querySelectorAll("[data-feed-card]"));
      const middle = root.scrollTop + root.clientHeight / 2;
      let next = 0, best = Infinity;
      cards.forEach((card, i) => {
        const distance = Math.abs(card.offsetTop + card.offsetHeight / 2 - middle);
        if (distance < best) { best = distance; next = i; }
      });
      const delta = root.scrollTop - lastScrollTopRef.current;
      if (delta > 12 && root.scrollTop > 80) setUiHidden(true);
      if (delta < -12 || root.scrollTop < 40) setUiHidden(false);
      lastScrollTopRef.current = Math.max(0, root.scrollTop);
      setActiveIndex((prev) => {
        if (prev !== next) {
          const duration = Date.now() - activeStartedAtRef.current;
          if (duration < 1200) behaviorRef.current.fast += 1;
          else behaviorRef.current.slow += 1;
          activeStartedAtRef.current = Date.now();
          navigator.vibrate?.(10);
          setPulse((value) => value + 1);
          preloadNext(next);
          maybeAiReorder(next);
          maybeReward(next);
          if (next > 0) pushFeedEvent("swipe", "⚡", "Kortti vaihtui — ranking elää");
        }
        return next;
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { window.requestAnimationFrame(updateActive); ticking = true; }
    }
    root.addEventListener("scroll", onScroll, { passive: true });
    updateActive();
    preloadNext(activeIndex);
    return () => root.removeEventListener("scroll", onScroll);
  }, [safePosts.length]);

  function getMode() {
    const { fast, slow } = behaviorRef.current;
    if (fast >= 3 && fast > slow * 1.4) return "skimmer";
    if (slow >= 2 && slow >= fast) return "reader";
    return "balanced";
  }

  function triggerReward(type, emoji, title, text, force = false) {
    const now = Date.now();
    if (!force && lastRewardTypeRef.current === type) return;
    if (!force && now - behaviorRef.current.rewardAt < 6500) return;
    behaviorRef.current.rewardAt = now;
    lastRewardTypeRef.current = type;
    setReward({ id: `${now}-${Math.random()}`, emoji, title, text });
    setActivity((prev) => [{ id: `${now}-${Math.random()}`, text: `${emoji} ${title}: ${text}` }, ...prev.slice(0, 4)]);
    navigator.vibrate?.([10, 25, 10]);
    setTimeout(() => { setReward(null); lastRewardTypeRef.current = null; }, 1800);
  }

  function maybeReward(cardIndex) {
    if (cardIndex <= 0) return;
    const postIndex = cardIndex - 1;
    const post = safePosts[postIndex];
    const motivation = buildMotivation({ post, index: postIndex, posts: safePosts, likeXp });
    if (motivation.tone === "pink") triggerReward("nearWin", "🎯", "Lähellä nousua", motivation.detail);
    else if (postIndex === 0) triggerReward("top", "👑", "Kärkipostaus", "Tämä johtaa kilpailua juuri nyt.");
    else if (likeXp.strongLikesLeft <= 3) triggerReward("scarcity", "⚡", "Strong liket vähissä", `${likeXp.strongLikesLeft} jäljellä`);
  }

  function preloadNext(cardIndex) {
    const postIndex = Math.max(0, cardIndex - 1);
    [postIndex, postIndex + 1, postIndex + 2, postIndex + 3].filter((i) => i >= 0 && i < safePosts.length).forEach((i) => {
      const post = safePosts[i];
      if (!post || preloadRef.current[post.id]) return;
      preloadRef.current[post.id] = true;
      if (post.image_url) { const img = new Image(); img.src = post.image_url; }
      setPreloaded((prev) => ({ ...prev, [post.id]: true }));
    });
  }

  function maybeAiReorder(cardIndex) {
    const mode = getMode();
    setBehaviorMode(mode);
    const now = Date.now();
    if (now - behaviorRef.current.reorderAt < 5000) return;
    if (cardIndex < 2 || safePosts.length < 5) return;
    behaviorRef.current.reorderAt = now;
    pushFeedEvent("ai", "🧠", `AI järjestää seuraavat kortit: ${mode}`, true);
    const postIndex = Math.max(0, cardIndex - 1);
    setPosts((prev) => {
      const safe = sanitizePosts(prev);
      const locked = safe.slice(0, postIndex + 1);
      const future = safe.slice(postIndex + 1);
      const reranked = [...future].sort((a, b) => scoreForMode(b, mode) - scoreForMode(a, mode));
      return [...locked, ...reranked];
    });
  }

  function jumpTo(index, smooth = true) {
    scrollerRef.current?.querySelector(`[data-feed-card-index="${index}"]`)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  }

  function handleTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchRef.current = { startY: touch.clientY, lastY: touch.clientY, startTime: Date.now() };
    setDragging(true); setUiHidden(true);
  }
  function handleTouchMove(event) {
    const touch = event.touches?.[0];
    if (touch) touchRef.current.lastY = touch.clientY;
  }
  function handleTouchEnd() {
    const { startY, lastY, startTime } = touchRef.current;
    const dy = startY - lastY;
    const dt = Math.max(1, Date.now() - startTime);
    const velocity = Math.abs(dy) / dt;
    const shouldSnap = Math.abs(dy) > 70 || velocity > 0.45;
    const direction = dy > 0 ? 1 : -1;
    const skip = velocity > 1.05 && Math.abs(dy) > 130 ? 2 : 1;
    const maxIndex = safePosts.length;
    setDragging(false);
    if (shouldSnap) {
      const target = Math.max(0, Math.min(activeIndex + direction * skip, maxIndex));
      navigator.vibrate?.(skip === 2 ? [8, 18, 8, 18] : [8, 20, 8]);
      preloadNext(target); jumpTo(target);
    } else { navigator.vibrate?.(6); jumpTo(activeIndex); }
  }

  async function loadFeed() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;
      setUser(currentUser);
      const { data: postsData, error: postsError } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(80);
      const { data: votesData, error: votesError } = await supabase.from("votes").select("post_id,user_id,value,group_id");
      if (postsError || votesError) throw postsError || votesError;
      const voteCounts = {}, votedMap = {};
      (votesData || []).forEach((vote) => {
        if (!vote?.post_id) return;
        voteCounts[vote.post_id] = (voteCounts[vote.post_id] || 0) + Number(vote.value || 1);
        if (vote.user_id === currentUser?.id) votedMap[vote.post_id] = true;
      });
      const prepared = sanitizePosts(postsData).map((post) => normalizePost(post, voteCounts[post.id] || 0)).filter(Boolean);
      setPosts(rankKolehtiFeed(prepared, { sameGroup: true }));
      setVoted(votedMap);
      setTimeout(() => preloadNext(activeIndex), 150);
    } catch (error) {
      console.warn("Feed load fallback", error);
      setToast(error?.message || "Feedin lataus epäonnistui");
      setPosts(starterPosts);
    } finally { setLoading(false); }
  }

  async function vote(post) {
    const safePost = normalizePost(post);
    if (!safePost || safePost.is_starter) { setToast("Luo oma perustelu ja kilpaile oikeasti."); setTimeout(() => setToast(""), 1800); return; }
    if (!user) { setToast("Kirjaudu ensin sisään."); setTimeout(() => setToast(""), 1600); return; }
    if (voted[safePost.id]) { setToast("Olet jo äänestänyt tämän."); setTimeout(() => setToast(""), 1600); return; }
    const { error } = await supabase.from("votes").insert({ post_id: safePost.id, user_id: user.id, group_id: safePost.group_id || null, value: 1 });
    if (error) { setToast(error.message || "Äänestys epäonnistui"); setTimeout(() => setToast(""), 1800); return; }
    navigator.vibrate?.([20, 40, 20]);
    triggerReward("vote", "💗", `+${likeXp.xp} XP`, "Ääni annettu ja ranking päivittyy.", true);
    setToast(`🔥 Ääni annettu. +${likeXp.xp} XP`);
    setTimeout(() => setToast(""), 2200);
    await loadFeed();
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_44%,#02030a_100%)]" />
      {toast && <div className="fixed left-1/2 top-5 z-[70] -translate-x-1/2 rounded-2xl border border-cyan-300/30 bg-cyan-500/20 px-5 py-3 text-sm font-black text-cyan-100 shadow-2xl backdrop-blur-xl">{toast}</div>}
      {pulse > 0 && <div key={pulse} className="pointer-events-none fixed inset-x-0 top-1/2 z-[60] mx-auto h-24 max-w-md -translate-y-1/2 rounded-full bg-cyan-300/10 blur-2xl animate-ping" />}
      <RewardBurst reward={reward} />
      <FeedLiveTicker activity={activity} hidden={uiHidden || dragging} />
      <header className={`fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#050816]/80 px-4 py-4 shadow-lg shadow-black/20 backdrop-blur-xl transition-transform duration-300 ${uiHidden || dragging ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="mx-auto flex max-w-md items-center justify-between"><div><h1 className="text-4xl font-black tracking-tight">KOLEHTI</h1><p className="text-[10px] font-black uppercase tracking-wide text-white/50">feed dopamine v3 · {behaviorMode}</p></div><Link to="/new" className="rounded-[24px] bg-cyan-500 px-5 py-4 text-sm font-black shadow-2xl shadow-cyan-500/25">Uusi</Link></div>
      </header>
      <div className="fixed right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2">
        {Array.from({ length: Math.min(safePosts.length + 1, 8) }).map((_, i) => <button key={i} onClick={() => jumpTo(i)} className={`rounded-full transition-all ${activeIndex === i ? "h-2 w-6 bg-cyan-300" : "h-2 w-2 bg-white/25"}`} aria-label={`Siirry kohtaan ${i + 1}`} />)}
      </div>
      <main ref={scrollerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className={`h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain scroll-smooth px-4 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden ${dragging ? "cursor-grabbing" : "cursor-grab"}`}>
        <section data-feed-card data-feed-card-index="0" className="mx-auto flex min-h-[100dvh] max-w-md snap-start items-center pt-24"><div className="w-full space-y-5"><PotHero livePot={livePot} likeXp={likeXp} behaviorMode={behaviorMode} /><div className="rounded-[34px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"><p className="text-xs font-black uppercase text-cyan-200">Swipe alas</p><h2 className="mt-2 text-4xl font-black leading-tight">Feed reagoi joka liikkeeseen</h2><p className="mt-3 text-sm font-bold leading-relaxed text-white/60">Live-eventit, near-win ja AI reorder tekevät feedistä kilpailun.</p></div></div></section>
        {loading ? <section data-feed-card data-feed-card-index="1" className="mx-auto flex min-h-[100dvh] max-w-md snap-start items-center"><div className="w-full rounded-[34px] border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" /><p className="font-black text-white/70">Feed latautuu...</p></div></section> : safePosts.map((post, index) => <section key={post.id || index} data-feed-card data-feed-card-index={index + 1} className="mx-auto flex min-h-[100dvh] max-w-md snap-start items-center py-5"><PostCard post={post} index={index} posts={safePosts} voted={Boolean(voted[post.id])} onVote={vote} likeXp={likeXp} active={activeIndex === index + 1} dragging={dragging} preloaded={Boolean(preloaded[post.id])} /></section>)}
      </main>
      <BottomNav hidden={uiHidden || dragging} />
    </div>
  );
}
