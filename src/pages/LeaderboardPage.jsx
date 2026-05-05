import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import LeaderboardScreen from "../features/leaderboard/LeaderboardScreen";

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;
    setCurrentUserId(userId);

    const { data } = await supabase
      .from("leaderboard")
      .select("*")
      .order("xp", { ascending: false })
      .limit(100);

    setUsers(data || []);
  }

  return (
    <LeaderboardScreen
      data={users}
      currentUserId={currentUserId}
    />
  );
}
