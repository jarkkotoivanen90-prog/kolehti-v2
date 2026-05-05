import { useEffect, useState, useMemo } from "react";
import { getUserRanking } from "../lib/rankings";
import LeaderboardScreen from "../features/leaderboard/LeaderboardScreen";

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getUserRanking(50);

    // 🔥 normalisoidaan data LeaderboardScreenille
    const normalized = (data || []).map((u, i) => ({
      id: u.id,
      user_id: u.id,
      user_name: u.display_name || u.username || "User",
      xp: u.xp || 0,
      prev_rank: u.prev_rank || null,
    }));

    setUsers(normalized);
  }

  return <LeaderboardScreen data={users} />;
}
