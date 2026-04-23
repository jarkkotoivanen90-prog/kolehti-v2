export default function PremiumStat({ label, value, tone = "blue" }) {
  const tones = {
    blue: "from-cyan-400/20 to-blue-500/10 text-cyan-100",
    green: "from-emerald-400/20 to-green-500/10 text-emerald-100",
    pink: "from-fuchsia-400/20 to-pink-500/10 text-fuchsia-100",
    amber: "from-amber-300/20 to-orange-500/10 text-amber-100",
  };
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${tones[tone]} px-4 py-3`}>
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
}
