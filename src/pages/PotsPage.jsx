import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import WinnerScreen from "../components/WinnerScreen";
import LossScreen from "../components/LossScreen";
import { mergeWithBots } from "../lib/bots";
import { buildWinnerRace } from "../lib/winnerSystem";

export default function PotsPage() {
  const [posts, setPosts] = useState([]);
  const [winnerData, setWinnerData] = useState(null);
  const [lossData, setLossData] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("posts").select("*");
    setPosts(data || []);
  }

  const race = useMemo(() => {
    const normalized = mergeWithBots(posts || [], 10);
    return buildWinnerRace(normalized, { potKey: "weekly", amount: 200 });
  }, [posts]);

  useEffect(() => {
    if (!race?.winner || race.status !== "closed") return;

    const userId = posts?.[0]?.user_id;
    const userEntry = posts.find(p => p.user_id === userId);

    if (race.winner.user_id === userId) {
      setWinnerData({ winner: race.winner, amount: 200, race });
    } else {
      setLossData({ userEntry, winner: race.winner, race, amount: 200 });
    }
  }, [race]);

  return (
    <div className="min-h-screen bg-black text-white p-4">

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
          onRevenge={() => window.location.href = "/new"}
        />
      )}

      <h1 className="text-4xl font-black">Potit</h1>

      <AppBottomNav />
    </div>
  );
}
