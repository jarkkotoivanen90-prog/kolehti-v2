import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import WinnerScreen from "../components/WinnerScreen";
import LossScreen from "../components/LossScreen";
import LiveRivalBattle from "../components/LiveRivalBattle";
import AdaptiveBackground from "../components/AdaptiveBackground";
import { haptic } from "../lib/effects";
import { mergeWithBots } from "../lib/bots";
import { buildWinnerRace, getWeekId } from "../lib/winnerSystem";
import { recordWeeklyOutcome } from "../lib/streakSystem";
import { decorateLeaderboard, recordIdentityResult } from "../lib/identitySystem";
import { fetchBackendScores, applyBackendScores } from "../lib/backendScoring";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200";

const outerCard = "relative overflow-hidden rounded-[34px] border border-cyan-200/20 bg-[#041226]/78 p-5 text-white shadow-2xl shadow-cyan-500/10";
const innerCard = "relative overflow-hidden rounded-[24px] border border-cyan-100/10 bg-white/[.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]";

function buildVoteMap(votes = []) {
  const map = {};
  votes.forEach((vote) => {
    if (!vote?.post_id) return;
    map[vote.post_id] = (map[vote.post_id] || 0) + Number(vote.value || 1);
  });
  return map;
}

function endOfDay() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function endOfWeek() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + (7 - day));
  d.setHours(23, 59, 59, 999);
  return d;
}

function endOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function endOfFinal() {
  const d = endOfMonth();
  d.setDate(d.getDate() + 7);
  return d;
}

function formatEnds(date) {
  const diff = Math.max(0, date.getTime() - Date.now());
  const hours = Math.floor(diff / 36e5);
  const minutes = Math.floor((diff % 36e5) / 6e4);
  if (hours >= 24) return `${Math.floor(hours / 24)} pv ${hours % 24} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

function potAmount(base, posts, votes, multiplier = 1) {
  return Math.round((base + posts * 0.35 + votes * 0.08) * multiplier);
}

function periodFilter(post, period) {
  const t = new Date(post.created_at || 0);
  const now = new Date();
  if (period === "day") return t.toDateString() === now.toDateString();
  if (period === "week") {
    const start = new Date(now);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    return t >= start;
  }
  if (period === "month") return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
  return true;
}

function SoftGlow() {
  return <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.14),transparent_45%)]" />;
}

function PotStat({ label, children }) {
  return (
    <div className={`${innerCard} text-center`}>
      <div className="text-[10px] font-black uppercase text-white/45">{label}</div>
      {children}
    </div>
  );
}

function PotCard({ title, label, amount, entrants, endsAt, leader, accent, index }) {
  const leaderName = leader?.identity?.alias || leader?.display_name || leader?.username || leader?.bot_name || "Ei johtajaa";
  const leaderScore = Math.round(leader?.score || leader?.backend_score || leader?.ai_score || 0);
  const recommended = index === 0;

  return (
    <section className={outerCard}>
      <SoftGlow />

      {recommended && (
        <div className="absolute right-4 top-4 z-20 rounded-full border border-cyan-100/10 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
          AI suosittelee
        </div>
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-3 pr-16">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/62">{label}</div>
            <h2 className="mt-1 text-2xl font-black leading-tight tracking-tight text-glass">{title}</h2>
          </div>
          {!recommended && <div className="rounded-full border border-cyan-100/10 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">Live</div>}
        </div>

        {recommended && (
          <div className="relative mt-4 rounded-[22px] border border-cyan-100/15 bg-cyan-300/10 px-4 py-3 text-xs font-black text-cyan-100">
            ⚡ Paras mahdollisuus juuri nyt
          </div>
        )}

        <div className="relative mt-5 grid grid-cols-2 gap-3 text-center">
          <PotStat label="Potti">
            <div className="mt-1 text-4xl font-black leading-none text-white text-glass">{amount}€</div>
          </PotStat>
          <PotStat label="Porukka">
            <div className="mt-1 text-4xl font-black leading-none text-cyan-100 text-glass">{entrants}</div>
          </PotStat>
        </div>

        <div className="relative mt-3 grid grid-cols-2 gap-3 text-center">
          <PotStat label="Päättyy">
            <div className="mt-1 text-lg font-black text-white text-glass">{formatEnds(endsAt)}</div>
          </PotStat>
          <PotStat label="Johtaja">
            <div className="mt-1 truncate text-lg font-black text-white text-glass">{leaderName}</div>
          </PotStat>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-full bg-black/45 p-1">
          <div className={`h-5 rounded-full bg-gradient-to-r ${accent} transition-all duration-700`} style={{ width: `${Math.max(14, Math.min(96, 28 + index * 16 + entrants * 4))}%` }} />
          <div className="absolute inset-0 grid place-items-center text-[10px] font-black uppercase tracking-wide text-white/80 text-glass">Score {leaderScore}</div>
        </div>

        <p className="relative mt-4 text-xs font-black text-cyan-100/70">Päivittyy reaaliajassa</p>
      </div>
    </section>
  );
}

export default function PotsPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [backendScores, setBackendScores] = useState({});
  const [voteImpact, setVoteImpact] = useState(null);
  const [livePulse, setLivePulse] = useState(0);
  const [winnerData, setWinnerData] = useState(null);
  const [lossData, setLossData] = useState(null);
  const handledOutcomeRef = useRef(null);
  const lastTopRef = useRef(null);
  const pulseTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    load();

    const channel = supabase
      .channel("kolehti-pots-live-v5")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes" }, (payload) => {
        if (!mounted) return;
        handleVoteInsert(payload?.new);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "votes" }, (payload) => {
        if (!mounted) return;
        handleVoteUpdate(payload?.new);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "votes" }, (payload) => {
        if (!mounted) return;
        handleVoteDelete(payload?.old);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        if (!mounted) return;
        showImpact("Uusi entry muutti potteja");
        loadPostsOnly();
      })
      .subscribe();

    const timer = setInterval(() => setLivePulse((v) => v + 1), 30000);

    return () => {
      mounted = false;
      clearInterval(timer);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!posts.length) return;
    fetchBackendScores(posts).then(setBackendScores);
  }, [posts, livePulse]);

  function triggerLivePulse() {
    if (pulseTimerRef.current) return;
    pulseTimerRef.current = setTimeout(() => {
      setLivePulse((v) => v + 1);
      pulseTimerRef.current = null;
    }, 260);
  }

  function showImpact(text = "Ääni muutti live-tilannetta", type = "tap") {
    haptic(type);
    setVoteImpact({ id: Date.now(), text });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setVoteImpact(null), 1500);
    triggerLivePulse();
  }

  function handleVoteInsert(vote) {
    if (!vote?.post_id) return;
    setVotes((prev) => [vote, ...prev].slice(0, 500));
    showImpact("Ääni vaikutti potteihin");
  }

  function handleVoteUpdate(vote) {
    if (!vote?.post_id) return;
    setVotes((prev) => prev.map((item) => item.id && vote.id && item.id === vote.id ? vote : item));
    showImpact("Ääni päivittyi");
  }

  function handleVoteDelete(vote) {
    if (!vote?.post_id) return;
    setVotes((prev) => vote.id ? prev.filter((item) => item.id !== vote.id) : prev.slice(1));
    showImpact("Ääni poistui tilanteesta");
  }

  async function loadPostsOnly() {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(300);
    setPosts(data || []);
  }

  async function load() {
    const [{ data: auth }, { data: postData }, { data: voteData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("votes").select("id,post_id,user_id,value,created_at").order("created_at", { ascending: false }).limit(500),
    ]);
    setUser(auth?.user || null);
    setPosts(postData || []);
    setVotes(voteData || []);
  }

  const voteMap = useMemo(() => buildVoteMap(votes), [votes]);

  const scoredPosts = useMemo(() => {
    const withVotes = (posts || []).map((post) => {
      const voteCount = Number(voteMap[post.id] || post.votes || post.vote_count || 0);
      return { ...post, votes: voteCount, vote_count: voteCount };
    });
    return applyBackendScores(withVotes, backendScores);
  }, [posts, voteMap, backendScores]);

  const race = useMemo(() => {
    const normalized = mergeWithBots(scoredPosts, 10);
    const result = buildWinnerRace(normalized, { potKey: "weekly", amount: 200 + Math.round(votes.length * 0.35) });
    result.ranked = decorateLeaderboard(result.ranked || []);
    return result;
  }, [scoredPosts, votes.length, livePulse]);

  const potData = useMemo(() => {
    const decoratedAll = decorateLeaderboard(mergeWithBots(scoredPosts, 10));
    const uniquePeople = new Set(decoratedAll.map((p) => p.user_id || p.id)).size;
    const countVotesFor = (period) => votes.filter((v) => {
      const linked = posts.find((p) => p.id === v.post_id);
      return linked ? periodFilter(linked, period) : true;
    }).length;
    const build = (period, title, label, base, endsAt, accent, index, multiplier = 1) => {
      const entries = decorateLeaderboard(decoratedAll.filter((p) => periodFilter(p, period))).sort((a, b) => Number(b.score || b.backend_score || 0) - Number(a.score || a.backend_score || 0));
      const entrants = Math.max(0, new Set(entries.map((p) => p.user_id || p.id)).size);
      const periodVotes = countVotesFor(period);
      return {
        title,
        label,
        amount: potAmount(base, entrants || uniquePeople, periodVotes, multiplier),
        entrants,
        endsAt,
        leader: entries[0] || race?.winner,
        accent,
        index,
      };
    };

    return [
      build("day", "Päivä", "Tämän päivän potti", 25, endOfDay(), "from-cyan-200 via-sky-400 to-blue-600", 0),
      build("week", "Viikko", "Viikon pääpotti", 200, endOfWeek(), "from-cyan-200 via-sky-400 to-blue-600", 1),
      build("month", "Kuukausi", "Kuukauden megakierros", 650, endOfMonth(), "from-cyan-200 via-sky-400 to-blue-600", 2),
      build("final", "Finaali", "Top-porukan finaalipotti", 1500, endOfFinal(), "from-cyan-200 via-sky-400 to-blue-600", 3, 1.25),
    ];
  }, [scoredPosts, votes, posts, race?.winner, livePulse]);

  useEffect(() => {
    const currentTopId = race?.winner?.id;
    if (lastTopRef.current && currentTopId && lastTopRef.current !== currentTopId) {
      showImpact("Johtaja vaihtui livenä", "heavy");
    }
    if (currentTopId) lastTopRef.current = currentTopId;
  }, [race?.winner?.id]);

  const userEntry = useMemo(() => {
    if (!user?.id) return null;
    const currentWeek = getWeekId();
    return (race?.ranked || []).find((entry) => entry.user_id === user.id && (entry.week_id === currentWeek || !entry.bot)) || null;
  }, [race, user?.id]);

  useEffect(() => {
    if (!race?.winner || race.status !== "closed" || !user?.id) return;
    const outcomeKey = `${race.weekId}-${user.id}-${race.winner.id}`;
    if (handledOutcomeRef.current === outcomeKey) return;
    handledOutcomeRef.current = outcomeKey;

    const didWin = race.winner.user_id === user.id;
    const nearWin = Boolean(userEntry && race.gap <= 120);

    recordWeeklyOutcome({ weekId: race.weekId, outcome: didWin ? "win" : "loss", nearWin });
    recordIdentityResult({ winner: race.winner, top3: race.top3 });

    if (didWin) {
      setWinnerData({ winner: race.winner, amount: race.amount || 200, race });
      setLossData(null);
    } else {
      setLossData({ userEntry, winner: race.winner, race, amount: race.amount || 200 });
      setWinnerData(null);
    }
  }, [race, user?.id, userEntry]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <style>{`@keyframes impactToast{0%{transform:translate(-50%,-12px) scale(.96);opacity:0}15%,85%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-12px) scale(.96);opacity:0}}.impact-toast{animation:impactToast 1.5s ease both}`}</style>
      <AdaptiveBackground src={BG} strength="balanced" />

      {voteImpact && (
        <div className="impact-toast fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm rounded-[26px] border border-cyan-200/20 bg-[#030816]/92 px-5 py-4 text-center text-sm font-black text-cyan-100 shadow-2xl shadow-blue-500/10 backdrop-blur-xl">
          ⚡ {voteImpact.text}
        </div>
      )}

      {winnerData && <WinnerScreen winner={winnerData.winner} amount={winnerData.amount} race={winnerData.race} onClose={() => setWinnerData(null)} />}
      {lossData && <LossScreen userEntry={lossData.userEntry} winner={lossData.winner} race={lossData.race} amount={lossData.amount} onClose={() => setLossData(null)} onRevenge={() => window.location.href = "/new"} />}

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.28em] text-cyan-100/70">Live potit</p>
            <h1 className="text-[46px] font-black leading-none tracking-tight text-glass">Potit</h1>
          </div>
          <div className="rounded-full border border-cyan-200/18 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100">reaaliaika</div>
        </div>

        <section className="mt-5 grid gap-4">
          {potData.map((pot) => <PotCard key={pot.title} {...pot} />)}
        </section>

        <div className="mt-5">
          <LiveRivalBattle ranked={race?.ranked || []} userId={user?.id} pulse={livePulse} />
        </div>

        <div className="mt-5 flex gap-3">
          <Link to="/new" className="flex-1 rounded-[26px] bg-cyan-500 px-4 py-4 text-center font-black text-white">Oma entry</Link>
          <Link to="/feed" className="flex-1 rounded-[26px] border border-cyan-100/10 bg-[#030816]/70 px-4 py-4 text-center font-black text-white">Feed</Link>
        </div>
      </main>
    </div>
  );
}
