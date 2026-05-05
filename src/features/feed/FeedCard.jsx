import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import FeedMedia from "./FeedMedia";
import {
  getScore,
  getVotes,
  getAuthor,
  getAvatar,
} from "./utils/feedFormatters";
import { whyForYou } from "./utils/feedGod"; // jos käytössä

// 📏 TEXT SIZE (parempi skaalaus)
function getTextSize(content = "") {
  const length = String(content || "").length;
  if (length > 400) return "text-[clamp(1.1rem,4.2vw,1.8rem)]";
  if (length > 250) return "text-[clamp(1.3rem,5vw,2.2rem)]";
  if (length > 140) return "text-[clamp(1.6rem,6vw,2.8rem)]";
  return "text-[clamp(1.9rem,7vw,3.4rem)]";
}

export default function FeedCard({
  post,
  active,
  liked,
  onLike,
  onShare,
  onMoney,
}) {
  const author = getAuthor(post);
  const avatar = getAvatar(post);
  const likes = getVotes(post) + (liked ? 1 : 0);
  const ai = getScore(post);

  const textClass = getTextSize(post?.content);

  // ❤️ DOUBLE TAP
  const lastTap = useRef(0);
  const [heart, setHeart] = useState(false);

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onLike?.();
      setHeart(true);
      setTimeout(() => setHeart(false), 700);
    }
    lastTap.current = now;
  }

  return (
    <motion.section
      onClick={handleTap}
      initial={{ scale: 0.96 }}
      animate={{ scale: active ? 1 : 0.96 }}
      transition={{ duration: 0.25 }}
      className="relative h-[100dvh] snap-start overflow-hidden bg-black"
    >
      {/* 🎥 MEDIA */}
      <FeedMedia post={post} active={active} />

      {/* 🌑 GLOBAL GRADIENT (EI BOXIA) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

      {/* ❤️ DOUBLE TAP HEART */}
      <AnimatePresence>
        {heart && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.4, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <div className="text-white text-6xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
              ♥
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📄 CONTENT */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 pb-36">

        {/* 🔥 TOP META */}
        <div className="mb-2 text-xs font-black text-cyan-200 flex items-center gap-3">

          {post?.boost_score > 0 && (
            <span className="text-orange-400">🔥 Boostattu</span>
          )}

          <span>{ai}%</span>

          {whyForYou && (
            <span className="opacity-70 text-[10px]">
              {whyForYou(post)}
            </span>
          )}
        </div>

        {/* 🧾 TEXT (SCROLLABLE, EI BOXIA) */}
        <div className="max-h-[48vh] overflow-y-auto pr-2">

          <p
            className={`${textClass} font-black text-white leading-[1.2]
            drop-shadow-[0_10px_40px_rgba(0,0,0,0.95)]
            [text-shadow:0_10px_40px_rgba(0,0,0,0.95)]
            `}
          >
            {post?.content}
          </p>

        </div>

        {/* 👤 USER */}
        <div className="mt-4 flex items-center gap-3 text-white/90">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            {avatar}
          </div>
          <span className="font-bold">{author}</span>
        </div>

      </div>

      {/* 🎯 FLOATING BUTTONS (PIENEMMÄT) */}
      <div className="absolute right-3 bottom-20 flex flex-col gap-3 z-20">

        <button
          onClick={onLike}
          className="w-12 h-12 rounded-full
          bg-gradient-to-br from-cyan-400 to-blue-600
          shadow-lg shadow-cyan-500/30
          text-white text-lg"
        >
          ♥
        </button>

        <button
          onClick={onShare}
          className="w-12 h-12 rounded-full
          bg-gradient-to-br from-cyan-400 to-blue-600
          shadow-lg shadow-cyan-500/30
          text-white text-lg"
        >
          ↗
        </button>

        <button
          onClick={onMoney}
          className="w-12 h-12 rounded-full
          bg-gradient-to-br from-cyan-400 to-blue-600
          shadow-lg shadow-cyan-500/30
          text-white text-lg"
        >
          €
        </button>

      </div>

      {/* 🔽 BOTTOM FADE (parempi luettavuus ilman boxia) */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

    </motion.section>
  );
}
