import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import WinnerScreen from "../components/WinnerScreen";
import LossScreen from "../components/LossScreen";
import EgoPanel from "../components/EgoPanel";
import LiveRivalBattle from "../components/LiveRivalBattle";
import { haptic } from "../lib/effects";
import { mergeWithBots } from "../lib/bots";
import { buildWinnerRace, getWeekId } from "../lib/winnerSystem";
import { recordWeeklyOutcome } from "../lib/streakSystem";
import { decorateLeaderboard, recordIdentityResult, getIdentityStory } from "../lib/identitySystem";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200";

function buildVoteMap(votes = []) {
  const map = {};
  votes.forEach((vote) => {
    if (!vote?.post_id) return;
    map[vote.post_id] = (map[vote.post_id] || 0) + Number(vote.value || 1);
  });
  return map;
}

export default function PotsPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
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
      .channel("kolehti-live-vote-impact-v2")
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
        showImpact("Uusi entry muutti kilpailua");
        loadPostsOnly();
      })
      .subscribe();

    return () => {
      mounted = false;
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

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
    showImpact("Ääni vaikutti tilanteeseen");
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

  const scoredPosts = useMemo(() => (posts || []).map((post) => {
    const voteCount = Number(voteMap[post.id] || post.votes || post.vote_count || 0);
    return { ...post, votes: voteCount, vote_count: voteCount };
  }), [posts, voteMap]);

  const race = useMemo(() => {
    const normalized = mergeWithBots(scoredPosts, 10);
    const result = buildWinnerRace(normalized, { potKey: "weekly", amount: 200 + Math.round(votes.length * 0.35) });
    result.ranked = decorateLeaderboard(result.ranked || []);
    return result;
  }, [scoredPosts, votes.length, livePulse]);

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
      <style>{`
        @keyframes impactToast{0%{transform:translate(-50%,-12px) scale(.96);opacity:0}15%,85%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-12px) scale(.96);opacity:0}}
        .impact-toast{animation:impactToast 1.5s ease both}
      `}</style>
      <img src={BG} alt="" className="fixed inset-0 h-full w-full object-cover" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/45 via-[#061126]/80 to-black/95" />

      {voteImpact && (
        <div className="impact-toast fixed left-1/2 top-24 z-[90] w-[calc(100%-32px)] max-w-sm rounded-[26px] border border-cyan-200/20 bg-[#030816]/92 px-5 py-4 text-center text-sm font-black text-cyan-100 shadow-2xl shadow-blue-500/10 backdrop-blur-xl">
          ⚡ {voteImpact.text}
        </div>
      )}

      {winnerData && <WinnerScreen winner={winnerData.winner} amount={winnerData.amount} race={winnerData.race} onClose={() => setWinnerData(null)} />}
      {lossData && <LossScreen userEntry={lossData.userEntry} winner={lossData.winner} race={lossData.race} amount={lossData.amount} onClose={() => setLossData(null)} onRevenge={() => window.location.href = "/new"} />}

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <h1 className="text-4xl font-black">Potit</h1>

        <div className="mt-4"><EgoPanel /></div>

        <div className="mt-4">
          <LiveRivalBattle ranked={race?.ranked || []} userId={user?.id} pulse={livePulse} />
        </div>

        <section className="mt-6 space-y-3">
          {race?.ranked?.slice(0,5).map((entry, i) => (
            <div key={entry.id} className={`rounded-xl p-3 transition-all duration-500 ${i === 0 ? "bg-cyan-300/10 ring-1 ring-cyan-200/20" : "bg-white/5"}`}>
              <div className="flex justify-between">
                <div>
                  <div className="font-black">{entry.identity.badge} {entry.identity.alias}</div>
                  <div className="text-xs text-white/60">{entry.identity.title}</div>
                </div>
                <div className="text-right">
                  <div className="font-black">{entry.winner_score || entry.score}</div>
                  <div className="text-[10px] font-black uppercase text-cyan-100/60">♥ {entry.votes || 0}</div>
                </div>
              </div>
              <div className="mt-1 text-xs text-cyan-200/70">{getIdentityStory(entry)}</div>
            </div>
          ))}
        </section>

        <div className="mt-4 flex gap-3">
          <Link to="/new" className="flex-1 rounded-[26px] bg-cyan-500 px-4 py-4 text-center font-black text-white">Oma entry</Link>
          <Link to="/feed" className="flex-1 rounded-[26px] border border-cyan-100/10 bg-[#030816]/70 px-4 py-4 text-center font-black text-white">Feed</Link>
        </div>
      </main>

      <AppBottomNav />
    </div>
  );
}
