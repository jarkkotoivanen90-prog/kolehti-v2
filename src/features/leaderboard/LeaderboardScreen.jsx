import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const PERIODS = [
  { id: "day", label: "Päivä" },
  { id: "week", label: "Viikko" },
  { id: "month", label: "Kuukausi" },
];

function rankChange(rank, prevRank) {
  if (!prevRank) return "same";
  if (rank < prevRank) return "up";
  if (rank > prevRank) return "down";
  return "same";
}

function medal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank;
}

function TopCard({ player, rank }) {
  if (!player) return null;
  const isWinner = rank === 1;

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`flex flex-col items-center rounded-[28px] px-4 py-5 text-center ${
        isWinner
          ? "bg-[rgba(14,165,255,0.25)]"
          : "bg-white/[.05]"
      }`}
    >
      <div className="text-4xl">{medal(rank)}</div>
      <div className="mt-2 truncate font-black">
        {player.user_name}
      </div>
      <div className="text-cyan-200 font-bold">
        {player.xp} XP
      </div>
    </motion.div>
  );
}

function Row({ player, rank, isCurrentUser }) {
  const change = rankChange(rank, player.prev_rank);

  return (
    <div
      className={`flex justify-between rounded-xl px-4 py-3 ${
        isCurrentUser ? "bg-cyan-500/20" : "bg-white/5"
      }`}
    >
      <div>
        #{rank} {player.user_name}
        <div className="text-xs opacity-60">
          {change === "up" && "↑ nousussa"}
          {change === "down" && "↓ laskussa"}
          {change === "same" && "vakaa"}
        </div>
      </div>

      <div className="text-cyan-200 font-bold">
        {player.xp}
      </div>
    </div>
  );
}

export default function LeaderboardScreen({ data = [], currentUserId = null }) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("day");

  const ranked = useMemo(
    () =>
      data.map((p, i) => ({
        ...p,
        rank: i + 1,
      })),
    [data]
  );

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const currentUser = ranked.find((p) => p.user_id === currentUserId);

  return (
    <div className="min-h-screen bg-[#050816] text-white p-4 pb-28">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black">🏆 Leaderboard</h1>

        <button
          onClick={() => navigate("/feed")}
          className="bg-cyan-500/20 px-3 py-2 rounded-full"
        >
          Feed
        </button>
      </div>

      {/* PERIOD */}
      <div className="flex gap-2 mt-4">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-2 rounded-full ${
              period === p.id ? "bg-cyan-500/40" : "bg-white/10"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* TOP 3 */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <TopCard player={top3[1]} rank={2} />
        <TopCard player={top3[0]} rank={1} />
        <TopCard player={top3[2]} rank={3} />
      </div>

      {/* LIST */}
      <div className="mt-6 space-y-2">
        {rest.map((p) => (
          <Row
            key={p.id}
            player={p}
            rank={p.rank}
            isCurrentUser={p.user_id === currentUserId}
          />
        ))}
      </div>

      {/* CURRENT USER */}
      {currentUser && (
        <div className="fixed bottom-4 left-4 right-4 bg-cyan-500/20 rounded-xl p-4">
          #{currentUser.rank} · {currentUser.user_name} — {currentUser.xp} XP
        </div>
      )}
    </div>
  );
}
