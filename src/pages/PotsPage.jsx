import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import WinnerScreen from "../components/WinnerScreen";
import LossScreen from "../components/LossScreen";
import EgoPanel from "../components/EgoPanel";
import { mergeWithBots } from "../lib/bots";
import { buildWinnerRace, getWeekId } from "../lib/winnerSystem";
import { recordWeeklyOutcome } from "../lib/streakSystem";
import { decorateLeaderboard, recordIdentityResult, getIdentityStory } from "../lib/identitySystem";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200";

export default function PotsPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [winnerData, setWinnerData] = useState(null);
  const [lossData, setLossData] = useState(null);
  const handledOutcomeRef = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: auth }, { data: postData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    setUser(auth?.user || null);
    setPosts(postData || []);
  }

  const race = useMemo(() => {
    const normalized = mergeWithBots(posts || [], 10);
    const result = buildWinnerRace(normalized, { potKey: "weekly", amount: 200 });
    result.ranked = decorateLeaderboard(result.ranked || []);
    return result;
  }, [posts]);

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

    recordWeeklyOutcome({
      weekId: race.weekId,
      outcome: didWin ? "win" : "loss",
      nearWin,
      score: userEntry?.winner_score || userEntry?.score || 0,
    });

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
      <img src={BG} alt="" className="fixed inset-0 h-full w-full object-cover" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/45 via-[#061126]/80 to-black/95" />

      {winnerData && (
        <WinnerScreen
          winner={winnerData.winner}
          amount={winnerData.amount}
          race={winnerData.race}
          onClose={() => setWinnerData(null)}
        />
      )}

      {lossData && (
        <LossScreen
          userEntry={lossData.userEntry}
          winner={lossData.winner}
          race={lossData.race}
          amount={lossData.amount}
          onClose={() => setLossData(null)}
          onRevenge={() => { window.location.href = "/new"; }}
        />
      )}

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <header className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/62">Viikon kilpailu</p>
          <h1 className="mt-2 text-[56px] font-black leading-none tracking-tight">Potit</h1>
        </header>

        <section className="premium-card mt-6 rounded-[34px] p-5">
          <EgoPanel />
        </section>

        <section className="mt-6 space-y-3">
          {race?.ranked?.slice(0,5).map((entry, i) => (
            <div key={entry.id} className="p-3 rounded-xl bg-white/5">
              <div className="flex justify-between">
                <div>
                  <div className="font-black">{entry.identity.badge} {entry.identity.alias}</div>
                  <div className="text-xs text-white/60">{entry.identity.title}</div>
                </div>
                <div className="text-right font-black">{entry.winner_score || entry.score}</div>
              </div>
              <div className="text-xs text-cyan-200/70 mt-1">{getIdentityStory(entry)}</div>
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
