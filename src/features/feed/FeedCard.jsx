import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FeedMedia from "./FeedMedia";
import {
  getScore,
  getVotes,
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

export default function FeedCard({
  post,
  active,
  index,
  liked,
  onLike,
  onShare,
  onMoney,
}) {
  const [showExplain, setShowExplain] = useState(false);

  const author = getAuthor(post);
  const avatar = getAvatar(post);
  const likes = getVotes(post) + (liked ? 1 : 0);
  const ai = getScore(post);

  const isWinner = index === 0;
  const textClass = getTextSize(post?.content);

  useEffect(() => {
    if (isWinner && active) {
      setTimeout(() => setShowExplain(true), 1200);
      setTimeout(() => setShowExplain(false), 4000);
    }
  }, [isWinner, active]);

  return (
    <motion.section
      initial={{ scale: 0.96 }}
      animate={{ scale: active ? 1 : 0.96 }}
      transition={{ duration: 0.3 }}
      className="relative h-[100dvh] snap-start overflow-hidden bg-black"
    >
      {/* 🎥 MEDIA */}
      <FeedMedia post={post} active={active} />

      {/* 🌑 GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

      {/* 📄 CONTENT */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 pb-40">

        {/* AI SCORE */}
        <div className="text-[11px] font-black uppercase text-cyan-200 mb-2">
          {ai}%
        </div>

        {/* 🔥 SCROLL TEXT AREA */}
        <div className="relative max-h-[48vh] overflow-y-auto pr-2">

          <p className={`${textClass} font-black text-white leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]`}>
            {post?.content}
          </p>

          {/* fade */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* USER */}
        <div className="mt-4 flex items-center gap-3 text-white/80">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            {avatar}
          </div>
          {author}
        </div>

      </div>

      {/* 🎯 FLOATING BUTTONS */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-3 z-20">

        <button
          onClick={onLike}
          className="w-14 h-14 rounded-full bg-[rgba(14,165,255,0.25)] border border-[rgba(139,238,255,0.4)] text-white text-xl"
        >
          ♥
        </button>

        <button
          onClick={onShare}
          className="w-14 h-14 rounded-full bg-[rgba(14,165,255,0.25)] border border-[rgba(139,238,255,0.4)] text-white text-xl"
        >
          ↗
        </button>

        <button
          onClick={onMoney}
          className="w-14 h-14 rounded-full bg-[rgba(14,165,255,0.25)] border border-[rgba(139,238,255,0.4)] text-white text-xl"
        >
          €
        </button>

      </div>

      {/* 🧠 AI EXPLAIN */}
      <AnimatePresence>
        {showExplain && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md"
          >
            <div className="rounded-3xl border border-cyan-200/30 bg-[rgba(14,165,255,0.18)] px-5 py-4 shadow-xl">

              <div className="text-[10px] uppercase text-cyan-100/70 font-black">
                AI analyysi
              </div>

              <div className="mt-2 text-sm font-bold text-white">
                {getAIExplanation(post)}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
