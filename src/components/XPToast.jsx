export default function XPToast({ value, text }) {
  if (!value) return null;

  return (
    <div className="fixed left-1/2 top-24 z-[999] -translate-x-1/2 animate-bounce rounded-3xl border border-yellow-300/30 bg-yellow-500/20 px-6 py-4 text-center font-black text-yellow-100 shadow-2xl backdrop-blur-xl">
      <div className="text-3xl">+{value} XP</div>
      <div className="mt-1 text-xs text-white/70">{text || "Palkinto"}</div>
    </div>
  );
}
