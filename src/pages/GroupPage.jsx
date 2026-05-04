import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AdaptiveBackground from "../components/AdaptiveBackground";
import { haptic } from "../lib/effects";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1200";
const panel = "relative overflow-hidden rounded-[34px] border border-cyan-200/20 bg-[#041226]/78 p-5 text-white shadow-2xl shadow-cyan-500/10";
const innerPanel = "relative overflow-hidden rounded-[24px] border border-cyan-200/30 bg-gradient-to-br from-[#0ea5ff]/30 via-[#0ea5ff]/20 to-[#020617]/60 shadow-[0_0_35px_rgba(14,165,255,.35),inset_0_1px_0_rgba(255,255,255,.10)] backdrop-blur-[10px]";

function Glow() {
  return <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.14),transparent_45%)]" />;
}

function groupXp(groupId, posts, votes) {
  const groupPosts = (posts || []).filter((p) => p.group_id === groupId);
  const postIds = new Set(groupPosts.map((p) => p.id));
  const groupVotes = (votes || []).filter((v) => postIds.has(v.post_id));
  const postScore = groupPosts.reduce((sum, p) => sum + Number(p.ai_score || 50) + Number(p.boost_score || 0) * 2 + Number(p.watch_time_total || 0) * 2 + Number(p.shares || 0) * 4, 0);
  const voteScore = groupVotes.reduce((sum, v) => sum + Number(v.value || 1) * 12, 0);
  return Math.round(postScore + voteScore);
}

function userContribution(groupId, userId, posts, votes) {
  if (!userId) return 0;
  const userPosts = (posts || []).filter((p) => p.group_id === groupId && p.user_id === userId);
  const ids = new Set(userPosts.map((p) => p.id));
  const voteScore = (votes || []).filter((v) => ids.has(v.post_id)).reduce((sum, v) => sum + Number(v.value || 1) * 12, 0);
  const postScore = userPosts.reduce((sum, p) => sum + 20 + Number(p.ai_score || 50) + Number(p.boost_score || 0) * 2 + Number(p.watch_time_total || 0) * 2 + Number(p.shares || 0) * 4, 0);
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
    const { data: existing, error: existingError } = await supabase.from("group_members").select("id").eq("group_id", groupId).eq("user_id", user.id).maybeSingle();
    if (existingError) { showToast(existingError.message, "warning"); return; }
    if (existing?.id) {
      const { error } = await supabase.from("group_members").update({ role: "member", active: true }).eq("id", existing.id);
      if (error) { showToast(error.message, "warning"); return; }
    } else {
      const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id, role: "member", active: true });
      if (error) { showToast(error.message, "warning"); return; }
    }
    localStorage.setItem("kolehti_group_id", groupId);
    localStorage.setItem("primary_group", groupId);
    showToast("Liityit porukkaan");
    await init();
  }

  function openGroup(groupId) {
    localStorage.setItem("kolehti_group_id", groupId);
    localStorage.setItem("primary_group", groupId);
    haptic("tap");
    navigate("/feed");
  }

  async function leaveGroup(groupId) {
    if (!user) return;
    const { error } = await supabase.from("group_members").update({ active: false }).eq("group_id", groupId).eq("user_id", user.id);
    if (error) { showToast(error.message, "warning"); return; }
    if (localStorage.getItem("kolehti_group_id") === groupId) localStorage.removeItem("kolehti_group_id");
    if (localStorage.getItem("primary_group") === groupId) localStorage.removeItem("primary_group");
    showToast("Poistuit porukasta");
    await init();
  }

  const rankedGroups = useMemo(() => {
    const base = [...groups].map((group) => {
      const xp = groupXp(group.id, posts, votes);
      const count = memberCount(group.id);
      const groupPosts = posts.filter((p) => p.group_id === group.id);
      const topPost = groupPosts.sort((a, b) => Number(b.ai_score || 0) - Number(a.ai_score || 0))[0];
      const contribution = userContribution(group.id, user?.id, posts, votes);
      return { ...group, xp, count, topPost, contribution };
    }).sort((a, b) => b.xp - a.xp);

    return base.map((group, index) => {
      const prev = base[index - 1];
      const next = base[index + 1];
      const diffToAbove = prev ? Math.max(1, prev.xp - group.xp) : 0;
      const diffToBelow = next ? Math.max(1, group.xp - next.xp) : 0;
      return { ...group, diffToAbove, diffToBelow };
    });
  }, [groups, posts, votes, members, user?.id]);

  const myGroup = rankedGroups.find((g) => isJoined(g.id));
  const totalXp = rankedGroups.reduce((s, g) => s + g.xp, 0);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <style>{`
        @keyframes toastIn{0%{transform:translate(-50%,-12px) scale(.95);opacity:0}15%,85%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-12px) scale(.95);opacity:0}}
        @keyframes liveDot{0%,100%{opacity:.55;transform:scale(.9)}50%{opacity:1;transform:scale(1.18)}}
        .toast-in{animation:toastIn 1.6s ease both}.live-dot{animation:liveDot 1.8s ease-in-out infinite}
      `}</style>

      <AdaptiveBackground src={BG} strength="balanced" />

      {toast && <div className="toast-in fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm rounded-[26px] border border-cyan-200/20 bg-[#030816]/90 px-5 py-4 text-center text-sm font-black text-cyan-100 shadow-2xl shadow-blue-500/10">{toast}</div>}

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/62">Yhteisöt</p>
              <h1 className="mt-2 text-[48px] font-black leading-none tracking-tight text-glass">Porukat</h1>
              <p className="mt-2 max-w-[280px] text-sm font-bold leading-snug text-white/62">Porukka ei ole lista — se on kilpailu finaalipaikasta.</p>
            </div>
            <Link data-haptic="tap" to="/feed" className={`${innerPanel} px-4 py-3 text-sm font-black text-white/85`}>Feed</Link>
          </div>
        </header>

        <section className={`${panel} mt-6`}>
          <Glow />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/62">Porukka ranking</p>
              <span className="flex items-center gap-2 rounded-full border border-cyan-100/12 bg-cyan-300/10 px-3 py-1 text-[10px] font-black text-cyan-100"><span className="live-dot h-2 w-2 rounded-full bg-cyan-200" /> LIVE</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black">
              <div className={`${innerPanel} p-3`}><div className="text-cyan-50/70">Porukat</div><div className="mt-1 text-2xl text-white text-glass">{groups.length}</div></div>
              <div className={`${innerPanel} p-3`}><div className="text-cyan-50/70">Jäsenet</div><div className="mt-1 text-2xl text-white text-glass">{members.length}</div></div>
              <div className={`${innerPanel} p-3`}><div className="text-cyan-50/70">XP</div><div className="mt-1 text-2xl text-white text-glass">{totalXp}</div></div>
            </div>
            {myGroup && <div className={`${innerPanel} mt-4 p-4 text-sm font-black text-cyan-100`}>Sinun porukka: {myGroup.name} · vaikutuksesi +{myGroup.contribution} XP</div>}
          </div>
        </section>

        {loading && <div className={`${panel} mt-4 text-center font-black`}><Glow /><div className="relative">Ladataan porukoita...</div></div>}

        <section className="mt-4 space-y-4">
          {!loading && rankedGroups.length === 0 ? (
            <div className={`${panel} text-center`}><Glow /><div className="relative"><div className="text-5xl">✨</div><p className="mt-3 text-xl font-black">Ei vielä porukoita</p><p className="mt-2 text-sm font-bold text-white/58">Porukat lisätään adminin kautta myöhemmin.</p></div></div>
          ) : rankedGroups.map((group, index) => (
            <GroupCard key={group.id} group={group} index={index} joined={isJoined(group.id)} onJoin={() => joinGroup(group.id)} onOpen={() => openGroup(group.id)} onLeave={() => leaveGroup(group.id)} />
          ))}
        </section>
      </main>
    </div>
  );
}

function GroupCard({ group, index, joined, onJoin, onOpen, onLeave }) {
  const rank = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
  const progress = Math.min(100, Math.max(8, group.xp / 25));
  const closeToAbove = group.diffToAbove > 0 && group.diffToAbove < 50;
  const threatBehind = group.diffToBelow > 0 && group.diffToBelow < 50;
  const targetText = index === 0 ? "Pidä johto — seuraava postaus voi ratkaista." : `Tavoite: +${group.diffToAbove} XP → sijoitus #${index}`;

  return (
    <article className={`${panel} ${joined ? "border-cyan-200/34" : ""}`}>
      <Glow />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`${innerPanel} grid h-10 w-10 place-items-center rounded-2xl text-sm font-black`}>{rank}</span>
              <h2 className="truncate text-2xl font-black text-white text-glass">{group.name}</h2>
            </div>
            <p className="mt-2 text-sm font-bold text-white/72">{joined ? "Olet mukana tässä porukassa." : "Liity ja vaikuta rankingiin."}</p>
            {joined && <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">Oma porukka</p>}
          </div>
          <div className={`${innerPanel} shrink-0 px-3 py-2 text-center`}><div className="text-xl font-black text-cyan-100 text-glass">{group.count}</div><div className="text-[10px] font-black uppercase text-cyan-50/70">jäsentä</div></div>
        </div>

        <div className="mt-4 text-[42px] font-black leading-none text-white text-glass">{group.xp} XP</div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/45"><div className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-sky-400 to-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} /></div>

        <div className="mt-4 grid gap-2 text-xs font-black">
          {closeToAbove && <div className={`${innerPanel} px-4 py-3 text-cyan-100`}>Vain {group.diffToAbove} XP edellä olevaan porukkaan</div>}
          {threatBehind && <div className={`${innerPanel} px-4 py-3 text-white/78`}>Takaa tuleva ero: {group.diffToBelow} XP</div>}
          {joined && <div className={`${innerPanel} px-4 py-3 text-cyan-100`}>Sinun vaikutus: +{group.contribution} XP</div>}
          {joined && <div className={`${innerPanel} px-4 py-3 text-white/80`}>{targetText}</div>}
        </div>

        <div className={`${innerPanel} mt-4 p-4`}>
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-wide text-cyan-200">Leaderboard preview</p><span className="flex items-center gap-1 text-[10px] font-black text-cyan-100"><span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-200" /> LIVE</span></div>
          <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-white/75">Top postaus: {group.topPost?.content || "Ei vielä postauksia"}</p>
        </div>

        <div className="mt-4 flex gap-3">
          {joined ? <><button data-haptic="tap" onClick={onOpen} className="flex-1 rounded-[24px] bg-cyan-500 px-4 py-3 font-black text-white active:scale-[0.98]">Avaa</button><button data-haptic="warning" onClick={onLeave} className={`${innerPanel} flex-1 px-4 py-3 font-black text-white active:scale-[0.98]`}>Poistu</button></> : <button data-haptic="success" onClick={onJoin} className="w-full rounded-[24px] bg-cyan-500 px-4 py-4 font-black text-white active:scale-[0.98]">Liity porukkaan</button>}
        </div>
      </div>
    </article>
  );
}
