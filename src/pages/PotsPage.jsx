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
    return buildWinnerRace(normalized, { potKey: "weekly", amount: 200 });
  }, [posts]);

  const userEntry = useMemo(() => {
    if (!user?.id) return null;
    const currentWeek = getWeekId();
    return (race?.ranked || []).find((entry) => entry.user_id === user.id && (entry.week_id === currentWeek || entry.weekly_entry || !entry.bot)) || null;
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
          <p className="mx-auto mt-2 max-w-[300px] text-sm font-bold leading-snug text-white/62">Yksi entry, yksi voittaja ja oma kehitys joka kierroksella.</p>
        </header>

        <section className="premium-card mt-6 rounded-[34px] p-5">
          <EgoPanel />
        </section>

        <section className="premium-card mt-4 rounded-[34px] p-5 text-center">
          <p className="text-xs font-black uppercase tracking-wide text-cyan-200">Viikkopotti</p>
          <div className="mt-2 text-[64px] font-black leading-none">€{race?.amount || 200}</div>
          {race?.winner && (
            <div className="mt-4 rounded-[26px] border border-cyan-100/10 bg-cyan-300/10 p-4 text-left">
              <p className="text-[10px] font-black uppercase tracking-wide text-cyan-100/60">Nykyinen voittaja</p>
              <p className="mt-1 text-xl font-black">🏆 {race.winner.bot ? race.winner.bot_name : "Pelaaja"}</p>
              <p className="mt-1 text-xs font-bold text-white/56">{race.winner.winner_score || race.winner.score || 0} pts</p>
            </div>
          )}
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
