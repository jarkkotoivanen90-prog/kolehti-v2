import { motion } from "framer-motion";

function Metric({ children, tone = "white" }) {
  const toneClass = tone === "green"
    ? "text-emerald-50 bg-emerald-400/12 border-emerald-200/25 shadow-emerald-400/10"
    : tone === "yellow"
      ? "text-yellow-50 bg-yellow-300/13 border-yellow-200/24 shadow-yellow-300/10"
      : tone === "cyan"
        ? "text-cyan-50 bg-cyan-400/15 border-cyan-200/30 shadow-cyan-300/15"
        : tone === "pink"
          ? "text-pink-50 bg-pink-400/13 border-pink-200/24 shadow-pink-300/10"
          : "text-white bg-cyan-400/10 border-cyan-200/20 shadow-cyan-300/10";

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 shadow-[0_0_22px_rgba(34,211,238,0.08)] backdrop-blur-md ${toneClass}`}>
      {children}
    </span>
  );
}

export default function TopHUD({ visible, data, onMenu, pulseKey }) {
  return (
    <motion.header
      initial={false}
      animate={{ y: visible ? 0 : -108 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="fixed left-0 right-0 top-0 z-[60] bg-gradient-to-b from-black/42 via-black/14 to-transparent px-3 pb-5 pt-[calc(env(safe-area-inset-top)+10px)]"
    >
      <motion.div
        key={pulseKey}
        animate={{ scale: [1, 1.018, 1], filter: ["drop-shadow(0 18px 45px rgba(0,0,0,.25))", "drop-shadow(0 20px 56px rgba(34,211,238,.20))", "drop-shadow(0 18px 45px rgba(0,0,0,.25))"] }}
        transition={{ duration: 0.55 }}
        className="relative overflow-hidden rounded-[28px] border border-cyan-100/24 bg-transparent text-white shadow-2xl shadow-black/20 backdrop-blur-0"
      >
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
        <div className="flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em]">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Metric tone="yellow">💰 {data.pot}</Metric>
            <Metric tone="cyan">👥 {data.users}</Metric>
            <Metric tone={data.joined ? "green" : "yellow"}>{data.joined ? "✓ mukana" : "äänestä"}</Metric>
            <Metric>🏆 <span className="ml-1 max-w-[72px] truncate">{data.leader}</span></Metric>
            <Metric tone="pink">❤️ {data.likes}</Metric>
            {data.trending && <Metric tone="yellow">🔥 trendaa nyt</Metric>}
            <Metric tone="cyan">🧠 {data.ai}%</Metric>
          </div>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onMenu?.(); }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-100/28 bg-cyan-400/14 text-xl font-black text-white shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-md transition active:scale-95 active:bg-cyan-400/22"
            aria-label="Avaa valikko"
          >
            ☰
          </button>
        </div>
      </motion.div>
    </motion.header>
  );
}
