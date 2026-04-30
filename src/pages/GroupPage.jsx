import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { haptic } from "../lib/effects";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1200";

function groupXp(groupId, posts, votes) {
  const groupPosts = (posts || []).filter((p) => p.group_id === groupId);
  const postIds = new Set(groupPosts.map((p) => p.id));
  const groupVotes = (votes || []).filter((v) => postIds.has(v.post_id));
  const postScore = groupPosts.reduce((sum, p) => sum + Number(p.ai_score || 50) + Number(p.boost_score || 0) * 2 + Number(p.watch_time_total || 0) * 2 + Number(p.shares || 0) * 4, 0);
  const voteScore = groupVotes.reduce((sum, v) => sum + Number(v.value || 1) * 12, 0);
  return Math.round(postScore + voteScore);
}

export default function GroupPage() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  useEffect(() => { init(); }, []);

  async function init() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const currentUser = auth?.user || null;
    setUser(currentUser);

    const [groupsRes, membersRes, postsRes, votesRes] = await Promise.all([
      supabase.from("groups").select("*").order("created_at", { ascending: false }),
      supabase.from("group_members").select("*").eq("active", true),
      supabase.from("posts").select("id,group_id,user_id,ai_score,boost_score,watch_time_total,shares,content").limit(500),
      supabase.from("votes").select("post_id,user_id,value").limit(5000),
    ]);

    if (groupsRes.error) console.warn(groupsRes.error.message);
    if (membersRes.error) console.warn(membersRes.error.message);
    if (postsRes.error) console.warn(postsRes.error.message);
    if (votesRes.error) console.warn(votesRes.error.message);

    setGroups(groupsRes.data || []);
    setMembers(membersRes.data || []);
    setPosts(postsRes.data || []);
    setVotes(votesRes.data || []);
    setLoading(false);
  }

  function isJoined(groupId) {
    return members.some((m) => m.group_id === groupId && m.user_id === user?.id);
  }

  function memberCount(groupId) {
    return members.filter((m) => m.group_id === groupId).length;
  }

  function showToast(text, type = "success") {
    setToast(text);
    haptic(type);
    setTimeout(() => setToast(""), 1600);
  }

  async function joinGroup(groupId) {
    if (!user) { navigate("/login"); return; }

    const { data: existing, error: existingError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) { showToast(existingError.message, "warning"); return; }

    if (existing?.id) {
      const { error } = await supabase.from("group_members").update({ role: "member", active: true }).eq("id", existing.id);
      if (error) { showToast(error.message, "warning"); return; }
    } else {
      const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id, role: "member", active: true });
      if (error) { showToast(error.message, "warning"); return; }
    }

    localStorage.setItem("kolehti_group_id", groupId);
    showToast("Liityit porukkaan 🔥");
    await init();
  }

  function openGroup(groupId) {
    localStorage.setItem("kolehti_group_id", groupId);
    haptic("tap");
    navigate("/feed");
  }

  async function leaveGroup(groupId) {
    if (!user) return;
    const { error } = await supabase.from("group_members").update({ active: false }).eq("group_id", groupId).eq("user_id", user.id);
    if (error) { showToast(error.message, "warning"); return; }
    if (localStorage.getItem("kolehti_group_id") === groupId) localStorage.removeItem("kolehti_group_id");
    showToast("Poistuit porukasta");
    await init();
  }

  const rankedGroups = useMemo(() => {
    return [...groups].map((group) => {
      const xp = groupXp(group.id, posts, votes);
      const count = memberCount(group.id);
      const groupPosts = posts.filter((p) => p.group_id === group.id);
      const topPost = groupPosts.sort((a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0))[0];
      return { ...group, xp, count, topPost };
    }).sort((a, b) => b.xp - a.xp);
  }, [groups, posts, votes, members]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <style>{`
        @keyframes toastIn{0%{transform:translate(-50%,-12px) scale(.95);opacity:0}15%,85%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-12px) scale(.95);opacity:0}}
        .toast-in{animation:toastIn 1.6s ease both}
      `}</style>

      <img src={BG} alt="" className="fixed inset-0 h-full w-full object-cover" loading="eager" decoding="async" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/35 via-[#061126]/72 to-black/94" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.18),transparent_36%)]" />

      {toast && <div className="toast-in fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm rounded-[26px] border border-cyan-300/30 bg-black/80 px-5 py-4 text-center text-sm font-black text-cyan-100 shadow-2xl shadow-cyan-300/20 backdrop-blur-xl">{toast}</div>}

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/78">🇫🇮 Suomi · porukat</p>
              <h1 className="mt-2 text-[44px] font-black leading-none tracking-tight">Porukat</h1>
              <p className="mt-2 text-sm font-bold text-white/60">Valitse porukka, nosta XP:tä ja kilpaile finaalipaikasta.</p>
            </div>
            <Link data-haptic="tap" to="/feed" className="rounded-2xl border border-white/15 bg-black/28 px-4 py-3 text-sm font-black text-white/85 backdrop-blur-xl">Feed</Link>
          </div>
        </header>

        <section className="mt-6 rounded-[34px] border border-white/15 bg-black/42 p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-wide text-cyan-200">Porukka ranking</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black">
            <div className="rounded-2xl bg-black/35 p-3"><div className="text-white/45">Porukat</div><div className="mt-1 text-2xl">{groups.length}</div></div>
            <div className="rounded-2xl bg-black/35 p-3"><div className="text-white/45">Jäsenet</div><div className="mt-1 text-2xl">{members.length}</div></div>
            <div className="rounded-2xl bg-black/35 p-3"><div className="text-white/45">XP</div><div className="mt-1 text-2xl">{rankedGroups.reduce((s, g) => s + g.xp, 0)}</div></div>
          </div>
        </section>

        {loading && <div className="mt-4 rounded-[30px] border border-white/15 bg-black/42 p-5 text-center font-black backdrop-blur-2xl">Ladataan porukoita...</div>}

        <section className="mt-4 space-y-4">
          {!loading && rankedGroups.length === 0 ? (
            <div className="rounded-[34px] border border-white/15 bg-black/42 p-6 text-center shadow-2xl backdrop-blur-2xl">
              <div className="text-5xl">✨</div>
              <p className="mt-3 text-xl font-black">Ei vielä porukoita</p>
              <p className="mt-2 text-sm font-bold text-white/58">Porukat lisätään adminin kautta myöhemmin.</p>
            </div>
          ) : rankedGroups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              index={index}
              joined={isJoined(group.id)}
              onJoin={() => joinGroup(group.id)}
              onOpen={() => openGroup(group.id)}
              onLeave={() => leaveGroup(group.id)}
            />
          ))}
        </section>
      </main>

      <AppBottomNav />
    </div>
  );
}

function GroupCard({ group, index, joined, onJoin, onOpen, onLeave }) {
  const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
  const progress = Math.min(100, Math.max(8, group.xp / 25));

  return (
    <article className={`rounded-[34px] border p-5 shadow-2xl backdrop-blur-2xl ${joined ? "border-cyan-300/35 bg-cyan-300/10 shadow-cyan-300/12" : "border-white/15 bg-black/42 shadow-black/30"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-sm font-black">{rank}</span>
            <h2 className="truncate text-2xl font-black text-white">{group.name}</h2>
          </div>
          <p className="mt-2 text-sm font-bold text-white/58">{joined ? "Olet mukana tässä porukassa." : "Voit liittyä tähän porukkaan."}</p>
        </div>
        <div className="shrink-0 rounded-[22px] border border-white/12 bg-black/35 px-3 py-2 text-center">
          <div className="text-xl font-black text-cyan-100">{group.count}</div>
          <div className="text-[10px] font-black uppercase text-white/45">jäsentä</div>
        </div>
      </div>

      <div className="mt-4 text-[42px] font-black leading-none text-yellow-300">{group.xp} XP</div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/45">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-black/32 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Leaderboard preview</p>
        <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-white/75">🔥 Top postaus: {group.topPost?.content || "Ei vielä postauksia"}</p>
      </div>

      <div className="mt-4 flex gap-3">
        {joined ? (
          <>
            <button data-haptic="tap" onClick={onOpen} className="flex-1 rounded-[24px] bg-pink-500 px-4 py-3 font-black text-white shadow-xl shadow-pink-500/20 active:scale-[0.98]">Avaa</button>
            <button data-haptic="warning" onClick={onLeave} className="flex-1 rounded-[24px] border border-white/12 bg-black/35 px-4 py-3 font-black text-white active:scale-[0.98]">Poistu</button>
          </>
        ) : (
          <button data-haptic="success" onClick={onJoin} className="premium-cta w-full rounded-[24px] bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-4 font-black text-white shadow-xl shadow-cyan-500/25 active:scale-[0.98]">Liity porukkaan</button>
        )}
      </div>
    </article>
  );
}
