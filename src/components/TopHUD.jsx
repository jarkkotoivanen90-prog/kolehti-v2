import { motion } from "framer-motion";

export default function TopHUD({ visible, data, onMenu, pulseKey }) {
  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : -80 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="fixed top-0 left-0 right-0 z-50 px-3 pt-3"
    >
      <motion.div
        key={pulseKey}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 px-3 py-2 flex items-center justify-between text-[11px] font-black text-white"
      >
        <div className="flex gap-2 items-center">
          <span>Pot {data.pot}</span>
          <span>Users {data.users}</span>
          <span>{data.joined ? "joined" : "vote"}</span>
        </div>

        <div className="flex gap-2 items-center">
          {data.trending && <span>hot</span>}
          <span>Leader {data.leader}</span>
          <span>Likes {data.likes}</span>
          <span>AI {data.ai}%</span>
        </div>

        <button onClick={onMenu}>Menu</button>
      </motion.div>
    </motion.div>
  );
}
