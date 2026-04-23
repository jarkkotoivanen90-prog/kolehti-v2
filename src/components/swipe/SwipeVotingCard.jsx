import { motion, useMotionValue, useTransform } from "framer-motion";

export default function SwipeVotingCard({ entry, onVote, onSkip }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const yesOpacity = useTransform(x, [0, 80, 160], [0, 0.4, 1]);
  const noOpacity = useTransform(x, [-160, -80, 0], [1, 0.4, 0]);

  return (
    <div className="relative mx-auto max-w-sm">
      <motion.div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-emerald-300 bg-emerald-500/20 px-4 py-2 text-lg font-black text-emerald-200" style={{ opacity: yesOpacity }}>
        ÄÄNESTÄ
      </motion.div>
      <motion.div className="pointer-events-none absolute right-4 top-4 z-20 rounded-2xl border border-rose-300 bg-rose-500/20 px-4 py-2 text-lg font-black text-rose-200" style={{ opacity: noOpacity }}>
        OHITA
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        style={{ x, rotate }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 120) onVote?.(entry);
          else if (info.offset.x < -120) onSkip?.(entry);
        }}
        className="overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(20,28,60,0.95),rgba(10,14,30,0.96))] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      >
        <div className="h-56 bg-[radial-gradient(circle_at_top,#6b7dff_0%,#2f3d8f_35%,#161b35_100%)]" />
        <div className="p-5">
          <div className="text-sm text-white/70">{entry.display_name || "Käyttäjä"} • {entry.trust_level || "new"}</div>
          <div className="mt-3 text-white/90">{entry.text || entry.body}</div>
          <div className="mt-4 flex justify-between text-sm text-white/70">
            <span>❤️ {entry.votes || 0}</span>
            <span>AI {Number(entry.ai_score || 0).toFixed(2)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
