import { motion } from "framer-motion";
import { useState, useRef } from "react";
import FeedMedia from "./FeedMedia";
import {
  getScore,
  getVotes,
  getAuthor,
  getAvatar,
} from "./utils/feedFormatters";

function getTextSize(content = "") {
  const length = String(content || "").length;

  if (length > 400) return "text-[clamp(1rem,4vw,1.6rem)]";
  if (length > 250) return "text-[clamp(1.2rem,4.5vw,2rem)]";
  if (length > 140) return "text-[clamp(1.4rem,5vw,2.4rem)]";
  return "text-[clamp(1.6rem,6vw,3rem)]";
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
  const ai = getScore(post);
  const textClass = getTextSize(post?.content);
  const isBoosted = Number(post?.boost_score || 0) > 0;

  const [burst, setBurst] = useState(false);
  const lastTapRef = useRef(0);

  function handleTap(e) {
    if (e.target.closest("button")) return;

    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      setBurst(true);
      onLike?.();
      setTimeout(() => setBurst(false), 500);
    }
    lastTapRef.current = now;
  }

  return (
    <motion.section className="relative h-[100dvh] snap-start overflow-hidden bg-black">

      {/* 🎥 MEDIA */}
      <div onClick={handleTap} className="absolute inset-0">
        <FeedMedia post={post} active={active} />
      </div>

      {/* 🌑 PEHMEÄ GRADIENT (EI MUSTAA LAATIKKOA) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      {/* ❤️ DOUBLE TAP */}
      {burst && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1.4, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-6xl">❤️</div>
        </motion.div>
      )}

      {/* 📄 CONTENT */}
      <div className="absolute bottom-44 left-5 right-20 z-20">

        {isBoosted && (
          <div className="mb-1 text-[11px] font-black text-cyan-300">
            🔥 Boostattu
          </div>
        )}

        <div className="mb-2 text-[11px] font-black text-cyan-200">
          {ai}%
        </div>

        {/* ✅ SCROLLABLE TEXT */}
        <div className="max-h-[48vh] overflow-y-auto pr-2">

          <p
            className={`${textClass} font-black text-white leading-[1.2] drop-shadow-[0_6px_30px_rgba(0,0,0,0.9)]`}
          >
            {post?.content}
          </p>

        </div>

        {/* 👤 USER */}
        <div className="mt-4 flex items-center gap-3 text-white/80">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            {avatar}
          </div>
          <span className="font-semibold">{author}</span>
        </div>

      </div>

      {/* 🎯 PIENEMMÄT NAPIT */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-3 z-30">

        <button
          onClick={onLike}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-lg active:scale-90"
        >
          ♥
        </button>

        <button
          onClick={onShare}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-lg active:scale-90"
        >
          ↗
        </button>

        <button
          onClick={onMoney}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-white text-lg active:scale-90"
        >
          €
        </button>

      </div>

      {/* 🎥 PROGRESS */}
      {active && (
        <div className="absolute top-0 left-0 h-[2px] w-full bg-white/20">
          <motion.div
            className="h-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 6, ease: "linear" }}
          />
        </div>
      )}

    </motion.section>
  );
}
