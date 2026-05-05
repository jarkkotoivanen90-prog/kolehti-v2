import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";

const filters = [
  { label: "päivä", value: "day" },
  { label: "viikko", value: "week" },
  { label: "kuukausi", value: "month" },
];

function addTrend(players) {
  return players.map((player, index) => {
    const prev = Number.isFinite(player.prev_rank) ? player.prev_rank : index;
    let trend = "same";

    if (index < prev) trend = "up";
    if (index > prev) trend = "down";

    return { ...player, trend };
  });
}

function getAITrendReason(player) {
  if (player.trend === "up") {
    if (player.score > 85) return "Perustelu resonoi vahvasti yhteisön kanssa.";
    if (player.xp > 1000) return "Aktiivisuus kasvatti näkyvyyttäsi.";
    return "Tasainen nousu – hyvä engagement.";
  }

  if (player.trend === "down") {
    return "Muut perustelut ohittivat sinut tällä hetkellä.";
  }

  return "Sijoitus pysyy vakaana.";
}

function FilterTabs({ active, setActive }) {
  return (
    <div className="mb-6 flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => setActive(filter.value)}
          className={`rounded-full border px-4 py-2 text-sm font-black transition active:scale-95 ${
            active === filter.value
              ? "border-[rgba(139,238,255,0.5)] bg-[rgba(14,165,255,0.32)] text-white"
              : "border-white/10 bg-white/[.055] text-white/62"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function Row({ player, index }) {
  const isWinner = index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: player.trend === "up" ? [1, 1.025, 1] : 1,
        boxShadow: isWinner
          ? [
              "0 0 0px rgba(14,165,255,0)",
              "0 0 26px rgba(14,165,255,0.36)",
              "0 0 0px rgba(14,165,255,0)",
            ]
          : player.trend === "up"
            ? "0 0 20px rgba(34,197,94,0.25)"
            : "none",
      }}
      transition={{
        delay: index * 0.035,
        duration: isWinner ? 2.2 : 0.35,
        repeat: isWinner ? Infinity : 0,
      }}
      className={`relative flex items-center justify-between rounded-2xl border px-4 py-4 ${
        isWinner
          ? "border-[rgba(139,238,255,0.48)] bg-[rgba(14,165,255,0.18)]"
          : player.trend === "up"
            ? "border-emerald-300/24 bg-emerald-400/10"
            : "border-white/10 bg-white/[.055]"
      }`}
    >
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">
          👑
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-7 text-center text-lg font-black">
          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
        </div>

        <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 font-black">
          {(player.user_name || player.name || "?")[0]}
        </div>

        <div>
          <div className="font-black text-white">
            {player.user_name || player.name || "Pelaaja"}
          </div>

          {isWinner ? (
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
              voittaja
            </div>
          ) : (
            <div className="text-xs font-bold text-white/55">XP {player.xp || 0}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {player.trend === "up" && (
          <motion.div
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-sm font-black text-emerald-300"
          >
            ↑
          </motion.div>
        )}

        {player.trend === "down" && (
          <motion.div
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-sm font-black text-red-300"
          >
            ↓
          </motion.div>
        )}

        <div className="text-lg font-black text-cyan-200">
          {player.score || 0}%
        </div>
      </div>
    </motion.div>
  );
}

export default function LeaderboardScreen() {
  const [filter, setFilter] = useState("day");
  const [players, setPlayers] = useState([]);
  const [aiHint, setAiHint] = useState(null);

  const filterLabel = useMemo(
    () => filters.find((item) => item.value === filter)?.label || "päivä",
    [filter]
  );

  async function fetchData() {
    const { data } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("period", filter)
      .order("score", { ascending: false })
      .limit(50);

    if (data) setPlayers(addTrend(data));
  }

  useEffect(() => {
    fetchData();
  }, [filter]);

  useEffect(() => {
    const channel = supabase
      .channel(`leaderboard-live-${filter}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaderboard" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  useEffect(() => {
    const rising = players.find((player) => player.trend === "up");

    if (!rising) return;

    setAiHint({
      name: rising.user_name || rising.name || "Pelaaja",
      text: getAITrendReason(rising),
    });

    const timeout = window.setTimeout(() => setAiHint(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [players]);

  return (
    <div className="min-h-[100dvh] bg-[#050816] px-4 pb-32 pt-20 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-100/62">
            KOLEHTI ranking
          </div>
          <h1 className="mt-2 text-[40px] font-black leading-none">Top lista</h1>
          <p className="mt-2 text-sm font-bold text-cyan-100/70">
            Parhaat perustelut ja aktiivisimmat pelaajat ({filterLabel})
          </p>
        </div>

        <FilterTabs active={filter} setActive={setFilter} />

        {players[0] && (
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 rounded-[30px] border border-[rgba(139,238,255,0.42)] bg-[rgba(14,165,255,0.16)] p-6 text-center shadow-2xl shadow-cyan-500/10"
          >
            <div className="text-4xl">👑</div>
            <div className="mt-2 text-2xl font-black">
              {players[0].user_name || players[0].name || "Pelaaja"}
            </div>
            <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/70">
              {filterLabel}n johtaja
            </div>
            <div className="mt-4 text-4xl font-black text-cyan-200">
              {players[0].score || 0}%
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-3">
          {players.map((player, index) => (
            <Row key={player.id || `${player.user_name}-${index}`} player={player} index={index} />
          ))}

          {!players.length && (
            <div className="rounded-[26px] border border-cyan-300/18 bg-white/[.055] p-6 text-center">
              <div className="text-3xl">🏆</div>
              <div className="mt-3 text-lg font-black">Top lista on tyhjä</div>
              <div className="mt-1 text-sm font-bold text-white/55">
                Ensimmäiset perustelut täyttävät rankingin.
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {aiHint && (
          <motion.div
            initial={{ y: 34, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-28 left-1/2 z-[999] w-[90%] max-w-sm -translate-x-1/2"
          >
            <div className="rounded-2xl border border-cyan-300/30 bg-[rgba(14,165,255,0.20)] px-4 py-3 shadow-xl shadow-cyan-500/10">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/70">
                AI analyysi
              </div>
              <div className="mt-1 text-sm font-bold text-white">
                {aiHint.name}: {aiHint.text}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
