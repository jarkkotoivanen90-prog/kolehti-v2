import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function mediaUrlFor(post) {
  return post?.media_url || post?.video_url || post?.image_url || post?.photo_url || "";
}

function mediaTypeFor(post) {
  const url = mediaUrlFor(post);
  if (!url) return null;
  if (post?.media_type === "video" || post?.video_url || /\.(mp4|webm|mov)(\?|$)/i.test(url)) return "video";
  return "image";
}

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
    created_at: post.created_at || new Date().toISOString(),
    votes: Number(post.votes || post.vote_count || voteCount || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
    watch_time_total: Number(post.watch_time_total || 0),
    media_url: mediaUrlFor(post) || null,
    media_type: mediaTypeFor(post),
  };
}

function scorePost(post) {
  return Number(post.votes || 0) * 12 + Number(post.ai_score || 0) + Number(post.growth_score || 0) * 0.6 + Number(post.boost_score || 0) * 2 + Number(post.watch_time_total || 0) * 2;
}

function rankBadge(index) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

export default function FeedPageMedia() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);
  const [voted, setVoted] = useState({});
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [activity, setActivity] = useState([]);
  const watchRef = useRef({});
  const eventAtRef = useRef(0);

  useEffect(() => {
    loadFeed();
    const channel = supabase
      .channel("media-feed-ready")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        pushEvent("📝 Uusi postaus feedissä", true);
        loadFeed();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        pushEvent("💗 Uusi ääni muutti rankingia", true);
        loadFeed();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function loadFeed() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;
      setUser(currentUser);

      const [{ data: postData, error: postError }, { data: voteData, error: voteError }] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(120),
        supabase.from("votes").select("post_id,user_id,value,created_at").limit(5000),
      ]);

      if (postError || voteError) throw postError || voteError;

      const voteMap = {};
      const votedMap = {};
      (voteData || []).forEach((vote) => {
        if (!vote?.post_id) return;
        voteMap[vote.post_id] = (voteMap[vote.post_id] || 0) + Number(vote.value || 1);
        if (vote.user_id === currentUser?.id) votedMap[vote.post_id] = true;
      });

      const prepared = (postData || [])
        .map((post) => normalizePost(post, voteMap[post.id] || 0))
        .filter(Boolean)
        .map((post) => ({ ...post, score: scorePost(post) }))
        .sort((a, b) => b.score - a.score);

      setPosts(prepared);
      setVotes(voteData || []);
      setVoted(votedMap);
    } catch (error) {
      console.warn("media feed load failed", error);
      pushEvent("⚠️ Feedin lataus epäonnistui", true);
    } finally {
      setLoading(false);
    }
  }

  function pushEvent(text, force = false) {
    const now = Date.now();
    if (!force && now - eventAtRef.current < 3500) return;
    eventAtRef.current = now;
    setEvent({ id: `${now}-${Math.random()}`, text });
    setActivity((prev) => [{ id: `${now}-${Math.random()}`, text }, ...prev.slice(0, 4)]);
    navigator.vibrate?.([8, 18, 8]);
    setTimeout(() => setEvent(null), 1800);
  }

  function startWatch(post) {
    if (!post?.id) return;
    if (!watchRef.current[post.id]) watchRef.current[post.id] = { started: Date.now(), rewarded: false };
  }

  async function rewardWatch(post) {
    if (!post?.id) return;
    const state = watchRef.current[post.id] || { rewarded: false };
    if (state.rewarded) return;
    watchRef.current[post.id] = { ...state, rewarded: true };
    pushEvent("👀 +2 XP · katselu auttaa porukkaa", true);

    const nextCount = Number(post.watch_time_total || 0) + 1;
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, watch_time_total: nextCount, score: scorePost({ ...p, watch_time_total: nextCount }) } : p));

    try {
      const { error } = await supabase.from("posts").update({ watch_time_total: nextCount }).eq("id", post.id);
      if (error) console.warn("watch_time_total update skipped", error.message);
    } catch (error) {
      console.warn("watch XP fallback", error);
    }
  }

  function handleVideoTime(event, post) {
    startWatch(post);
    if (Number(event?.target?.currentTime || 0) >= 3) rewardWatch(post);
  }

  async function vote(post) {
    if (!user) {
      pushEvent("Kirjaudu ensin sisään", true);
      return;
    }
    if (voted[post.id]) {
      pushEvent("Olet jo äänestänyt tämän", true);
      return;
    }

    const { error } = await supabase.from("votes").insert({ post_id: post.id, user_id: user.id, value: 1 });
    if (error) {
      pushEvent(error.message || "Äänestys epäonnistui", true);
      return;
    }

    setVoted((prev) => ({ ...prev, [post.id]: true }));
    pushEvent("💗 +XP · ääni annettu", true);
    await loadFeed();
  }

  const activePlayers = useMemo(() => {
    const ids = new Set();
    posts.forEach((post) => post.user_id && ids.add(post.user_id));
    votes.forEach((vote) => vote.user_id && ids.add(vote.user_id));
    return Math.max(1, ids.size);
  }, [posts, votes]);

  return (
    <div className="min-h-[100dvh] bg-[#050816] px-4 pb-28 pt-24 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#12306e_0%,#050816_45%,#02030a_100%)]" />

      {event && (
        <div className="fixed left-1/2 top-24 z-[80] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-[26px] border border-cyan-300/30 bg-black/70 px-5 py-4 text-center text-sm font-black text-white shadow-2xl backdrop-blur-xl">
          {event.text}
        </div>
      )}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#050816]/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black tracking-tight">KOLEHTI</h1>
            <p className="text-[10px] font-black uppercase tracking-wide text-white/45">media feed · porukka XP</p>
          </div>
          <Link to="/new" className="rounded-[22px] bg-cyan-500 px-5 py-4 text-sm font-black shadow-2xl shadow-cyan-500/25">Uusi</Link>
        </div>
      </header>

      <main className="mx-auto max-w-md">
        <section className="rounded-[34px] border border-yellow-300/20 bg-yellow-300/10 p-5 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-wide text-yellow-200">🔥 Päivän kierros</p>
          <h2 className="mt-1 text-4xl font-black">Media kasvattaa pottia</h2>
          <p className="mt-2 text-sm font-bold text-white/60">Katso kuvaa tai videota vähintään 3 sekuntia → porukka-XP kasvaa.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Pelaajat</div><div className="mt-1 text-xl">{activePlayers}</div></div>
            <div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Postit</div><div className="mt-1 text-xl">{posts.length}</div></div>
            <div className="rounded-2xl bg-black/25 p-3"><div className="text-white/45">Live</div><div className="mt-1 text-xl text-green-300">ON</div></div>
          </div>
        </section>

        {activity.length > 0 && (
          <section className="mt-4 rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wide text-cyan-100">Live feed</p>
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            </div>
            <div className="space-y-2">
              {activity.slice(0, 3).map((item) => <div key={item.id} className="rounded-2xl bg-black/20 px-3 py-2 text-xs font-black text-white/75">{item.text}</div>)}
            </div>
          </section>
        )}

        {loading && <div className="mt-6 rounded-[28px] border border-white/10 bg-white/10 p-6 text-center font-black text-white/70">Feed latautuu...</div>}

        {!loading && posts.length === 0 && (
          <section className="mt-6 rounded-[34px] border border-white/10 bg-white/10 p-8 text-center shadow-2xl">
            <div className="text-5xl">✨</div>
            <h2 className="mt-3 text-3xl font-black">Ei vielä postauksia</h2>
            <p className="mt-2 text-sm font-bold text-white/55">Luo ensimmäinen kuva-, video- tai tekstipostaus.</p>
            <Link to="/new" className="mt-5 block rounded-[24px] bg-cyan-500 px-5 py-4 text-sm font-black">Luo postaus</Link>
          </section>
        )}

        <div className="mt-5 space-y-5">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} voted={Boolean(voted[post.id])} onVote={vote} onImageWatch={rewardWatch} onImageStart={startWatch} onVideoTime={handleVideoTime} />
          ))}
        </div>
      </main>
    </div>
  );
}

function PostCard({ post, index, voted, onVote, onImageStart, onImageWatch, onVideoTime }) {
  const mediaUrl = mediaUrlFor(post);
  const mediaType = mediaTypeFor(post);

  return (
    <article className="overflow-hidden rounded-[36px] border border-cyan-300/20 bg-white/10 p-[2px] shadow-2xl backdrop-blur-xl">
      <div className="rounded-[34px] bg-[#111827]/95 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-yellow-300 text-xl font-black text-black">{rankBadge(index)}</div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-xs font-black uppercase text-cyan-200">{mediaUrl ? mediaType === "video" ? "🎥 Video" : "🖼️ Kuva" : "💬 Teksti"}</p>
            <p className="mt-1 text-xs font-black text-white/45">Score {Math.round(post.score || 0)}</p>
          </div>
        </div>

        <p className="mt-5 whitespace-pre-wrap break-words text-xl font-black leading-relaxed text-white/85">{post.content}</p>

        {mediaUrl && (
          <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
            {mediaType === "video" ? (
              <video src={mediaUrl} className="max-h-[520px] w-full object-cover" autoPlay muted loop playsInline controls={false} onPlay={() => onImageStart(post)} onTimeUpdate={(event) => onVideoTime(event, post)} />
            ) : (
              <img src={mediaUrl} alt="Post media" className="max-h-[520px] w-full object-cover" onLoad={() => onImageStart(post)} onMouseEnter={() => onImageWatch(post)} onTouchStart={() => { onImageStart(post); setTimeout(() => onImageWatch(post), 3000); }} />
            )}
            <div className="border-t border-white/10 px-4 py-3 text-xs font-black text-pink-100">👀 Katso 3s → porukka-XP</div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black">
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">ÄÄNET</div><div className="mt-1 text-2xl">{post.votes}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">KATSELUT</div><div className="mt-1 text-2xl text-pink-300">{post.watch_time_total || 0}</div></div>
          <div className="rounded-2xl bg-black/30 p-3"><div className="text-white/45">SIJA</div><div className="mt-1 text-2xl">#{index + 1}</div></div>
        </div>

        <button type="button" onClick={() => onVote(post)} disabled={voted} className="mt-5 w-full rounded-[26px] bg-cyan-500 px-5 py-5 text-xl font-black text-white shadow-2xl shadow-cyan-500/25 transition active:scale-[0.98] disabled:bg-white/10 disabled:text-white/40">
          {voted ? "Äänestetty" : "Tykkää +XP"}
        </button>
      </div>
    </article>
  );
}
