import { useMemo, useState } from "react";
import { motion } from "framer-motion";
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
      className={`flex flex-col items-center rounded-[28px] border px-4 py-5 text-center ${
        isWinner
          ? "border-cyan-300/50 bg-[rgba(14,165,255,0.22)] shadow-2xl shadow-cyan-500/25"
          : "border-white/10 bg-white/[.055]"
      }`}
    >
      <div className="text-4xl">{medal(rank)}</div>

      <div className="mt-2 max-w-[110px] truncate text-lg font-black">
        {player.user_name || "Pelaaja"}
      </div>

      <div className="mt-1 text-sm font-black text-cyan-200">
        {player.xp || 0} XP
      </div>

      <div className="mt-1 text-xs font-black text-white/50">
        Level {player.level || 1}
      </div>

      {isWinner && (
        <div className="mt-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
          johtaja
        </div>
      )}
    </motion.div>
  );
}

function Row({ player, rank, isCurrentUser }) {
  const change = rankChange(rank, player.prev_rank);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${
        isCurrentUser
          ? "border-cyan-300/50 bg-[rgba(14,165,255,0.22)]"
          : "border-white/10 bg-white/[.055]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-lg font-black">
          {medal(rank)}
        </div>

        <div>
          <div className="font-black">{player.user_name || "Pelaaja"}</div>

          <div className="text-xs font-bold text-white/55">
            {change === "up" && (
              <span className="text-emerald-300">↑ nousussa</span>
            )}
            {change === "down" && (
              <span className="text-red-300">↓ laskussa</span>
            )}
            {change === "same" && <span>vakaa</span>}
          </div>

          <div className="text-xs font-bold text-orange-300">
            🔥 {player.streak_count || 0} pv streak
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-lg font-black text-cyan-200">
          {player.xp || 0}
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
          XP · L{player.level || 1}
        </div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardScreen({
  data = [],
  currentUserId = null,
}) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("day");

  const ranked = useMemo(() => {
    return [...data]
      .filter((item) => !item.period || item.period === period)
      .sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0))
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));
  }, [data, period]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const currentUser = ranked.find((p) => p.user_id === currentUserId);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] px-4 pb-32 pt-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,255,0.24),transparent_42%)]" />

      <main className="relative z-10 mx-auto max-w-md">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100/62">
              KOLEHTI
            </div>

            <h1 className="mt-2 text-[42px] font-black leading-none">
              Top-lista
            </h1>

            <p className="mt-2 text-sm font-bold text-cyan-100/70">
              Nouse rankingissa, kerää XP:tä ja tavoittele pottia.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/feed")}
            className="rounded-full border border-cyan-300/35 bg-[rgba(14,165,255,0.22)] px-4 py-3 text-sm font-black text-white active:scale-95"
          >
            Feed
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-full border border-cyan-300/18 bg-white/[.045] p-1">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`rounded-full px-3 py-3 text-sm font-black transition active:scale-95 ${
                period === item.id
                  ? "bg-[rgba(14,165,255,0.34)] text-white shadow-lg shadow-cyan-500/15"
                  : "text-white/55"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="mt-8">
          <div className="grid grid-cols-3 items-end gap-3">
            <TopCard player={top3[1]} rank={2} />
            <TopCard player={top3[0]} rank={1} />
            <TopCard player={top3[2]} rank={3} />
          </div>
        </section>

        <div className="mt-8">
          <h2 className="text-lg font-black">Ranking</h2>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {rest.map((player) => (
            <Row
              key={player.id || player.user_id}
              player={player}
              rank={player.rank}
              isCurrentUser={player.user_id === currentUserId}
            />
          ))}

          {!ranked.length && (
            <div className="rounded-[28px] border border-white/10 bg-white/[.055] p-6 text-center">
              <div className="text-4xl">🏆</div>
              <div className="mt-3 text-xl font-black">Ei rankingia vielä</div>
              <div className="mt-1 text-sm font-bold text-white/55">
                Ensimmäiset postaukset täyttävät listan.
              </div>
            </div>
          )}
        </div>
      </main>

      {currentUser && (
        <div className="fixed bottom-5 left-0 right-0 z-50 px-4">
          <div className="mx-auto flex max-w-md items-center justify-between rounded-[24px] border border-cyan-300/40 bg-[rgba(14,165,255,0.22)] px-4 py-4 text-white shadow-2xl shadow-cyan-500/15 backdrop-blur-md">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/70">
                Sinun sijoitus
              </div>
              <div className="text-lg font-black">
                #{currentUser.rank} · {currentUser.user_name}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-black text-cyan-200">
                {currentUser.xp}
              </div>
              <div className="text-[10px] font-black text-white/50">
                XP · L{currentUser.level || 1}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
