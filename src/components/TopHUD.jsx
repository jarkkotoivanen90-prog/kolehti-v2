import { motion } from "framer-motion";

function Metric({ children, tone = "white" }) {
  const toneClass = tone === "green" ? "text-emerald-100 bg-emerald-400/12 border-emerald-200/18" : tone === "yellow" ? "text-yellow-100 bg-yellow-300/12 border-yellow-200/18" : tone === "cyan" ? "text-cyan-100 bg-cyan-300/12 border-cyan-200/18" : tone === "pink" ? "text-pink-100 bg-pink-400/12 border-pink-200/18" : "text-white bg-white/8 border-white/10";
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 ${toneClass}`}>{children}</span>;
}

export default function TopHUD({ visible, data, onMenu, pulseKey }) {
  return (
    <motion.header
      initial={false}
      animate={{ y: visible ? 0 : -96 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="fixed left-0 right-0 top-0 z-[60] px-3 pt-[calc(env(safe-area-inset-top)+10px)]"
    >
      <motion.div
        key={pulseKey}
        animate={{ scale: [1, 1.025, 1], boxShadow: ["0 18px 60px rgba(0,0,0,.28)", "0 20px 70px rgba(34,211,238,.18)", "0 18px 60px rgba(0,0,0,.28)"] }}
        transition={{ duration: 0.55 }}
        className="overflow-hidden rounded-[28px] border border-white/12 bg-[#050816]/72 text-white shadow-2xl shadow-black/40 backdrop-blur-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/55 to-transparent" />
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
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/12 bg-white/8 text-xl font-black text-white shadow-lg shadow-black/20 transition active:scale-95"
            aria-label="Avaa valikko"
          >
            ☰
          </button>
        </div>
      </motion.div>
    </motion.header>
  );
}
