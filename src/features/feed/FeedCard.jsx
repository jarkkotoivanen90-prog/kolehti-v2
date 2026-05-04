import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FeedMedia from "./FeedMedia";
import {
  getScore,
  getVotes,
  getShares,
  getAuthor,
  getAvatar,
} from "./utils/feedFormatters";

// 📏 TEXT SIZE
function getTextSize(content = "") {
  const length = String(content || "").length;
  if (length > 360) return "text-[clamp(1.2rem,4.8vw,2rem)]";
  if (length > 220) return "text-[clamp(1.4rem,5.5vw,2.4rem)]";
  if (length > 120) return "text-[clamp(1.6rem,6.2vw,2.8rem)]";
  return "text-[clamp(1.9rem,7vw,3.2rem)]";
}

// 🧠 AI EXPLAIN
function getAIExplanation(post) {
  if (!post?.content) return "Tämä perustelu resonoi yhteisön kanssa.";
  const text = post.content.toLowerCase();

  if (text.includes("perhe") || text.includes("läheis")) {
    return "Vahva yhteisöllinen vaikutus – hyödyttää muitakin.";
  }
  if (text.includes("rohkea") || text.includes("muutos")) {
    return "Selkeä päätöshetki – korkea merkitys.";
  }
  if (text.length > 200) {
    return "Hyvin perusteltu kokonaisuus.";
  }
  return "Tasapainoinen yhdistelmä tunnetta ja hyötyä.";
}

// 💸 MONEY RAIN
function MoneyRain() {
  return Array.from({ length: 10 }).map((_, i) => (
    <motion.div
      key={i}
      initial={{ y: -100, x: Math.random() * window.innerWidth }}
      animate={{ y: window.innerHeight + 100 }}
      transition={{ duration: 1.5 + Math.random() }}
      className="fixed text-2xl z-[999]"
    >
      💸
    </motion.div>
  ));
}

export default function FeedCard({
  post,
  active,
  index,
  liked,
  shared,
  onLike,
  onShare,
  onMoney,
}) {
  const [likeFx, setLikeFx] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const author = getAuthor(post);
  const avatar = getAvatar(post);
  const likes = getVotes(post) + (liked ? 1 : 0);
  const ai = getScore(post);

  const isWinner = index === 0;
  const textClass = getTextSize(post?.content);

  useEffect(() => {
    if (isWinner && active) {
      setShowWin(true);
      setTimeout(() => setShowWin(false), 2000);
      setTimeout(() => setShowExplain(true), 1200);
      setTimeout(() => setShowExplain(false), 4000);
    }
  }, [isWinner, active]);

  return (
    <motion.section
      animate={showWin ? { x: [0, -6, 6, -4, 4, 0] } : {}}
      className="relative h-[100dvh] snap-start overflow-hidden bg-black"
    >
      {/* MEDIA */}
      <FeedMedia post={post} active={active} />

      {/* GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

      {/* CONTENT */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 pb-36">
        <div className="text-[10px] font-black uppercase text-cyan-200 mb-2">
          {ai}%
        </div>

        <p className={`${textClass} font-black text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]`}>
          {post?.content}
        </p>

        <div className="mt-4 flex items-center gap-3 text-white/80">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            {avatar}
          </div>
          {author}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-3 z-20">
        <button
          onClick={() => {
            setLikeFx(true);
            setTimeout(() => setLikeFx(false), 500);
            onLike?.();
          }}
          className="w-14 h-14 rounded-full bg-cyan-500/30 border border-cyan-300/40"
        >
          ♥
        </button>

        <button
          onClick={onShare}
          className="w-14 h-14 rounded-full bg-cyan-500/30 border border-cyan-300/40"
        >
          ↗
        </button>

        <button
          onClick={onMoney}
          className="w-14 h-14 rounded-full bg-cyan-500/30 border border-cyan-300/40"
        >
          €
        </button>
      </div>

      {/* LIKE FX */}
      <AnimatePresence>
        {likeFx && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 5, opacity: 0 }}
            className="absolute inset-0 bg-cyan-400/30"
          />
        )}
      </AnimatePresence>

      {/* WINNER */}
      <AnimatePresence>
        {showWin && (
          <>
            <MoneyRain />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[999]"
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
            >
              <div className="text-center">
                <div className="text-5xl text-yellow-300">🏆 VOITIT</div>
                <div className="text-4xl text-white">1000€</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI EXPLAIN */}
      <AnimatePresence>
        {showExplain && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-cyan-500/20 p-4 rounded-2xl z-[999]"
          >
            {getAIExplanation(post)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
