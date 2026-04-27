import { useEffect, useState } from "react";
import { getUserRanking } from "../lib/rankings";

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getUserRanking(50);
    setUsers(data);
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-4">🏆 Leaderboard</h1>

      {users.map((u, i) => (
        <div key={u.id} className="flex justify-between p-3 border-b border-white/10">
          <div>#{i + 1} {u.display_name || u.username}</div>
          <div>{u.xp} XP</div>
        </div>
      ))}
    </div>
  );
}
