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
  if (length > 360) return "text-[clamp(1.2rem,4.8vw,2rem)]";
  if (length > 220) return "text-[clamp(1.4rem,5.5vw,2.4rem)]";
  if (length > 120) return "text-[clamp(1.6rem,6.2vw,2.8rem)]";
  return "text-[clamp(1.9rem,7vw,3.2rem)]";
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
  const isBoosted = Number(post?.boost_score || 0) > 0;

  // ❤️ double tap state
  const [burst, setBurst] = useState(false);
  const lastTapRef = useRef(0);

  function handleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      setBurst(true);
      onLike?.();
      setTimeout(() => setBurst(false), 600);
    }
    lastTapRef.current = now;
  }

  return (
    <motion.section
      initial={{ scale: 0.96 }}
      animate={{ scale: active ? 1 : 0.96 }}
      transition={{ duration: 0.3 }}
      className={`relative h-[100dvh] snap-start overflow-hidden bg-black ${
        isBoosted ? "ring-2 ring-cyan-400/40" : ""
      }`}
    >
      {/* 🎥 MEDIA + TAP */}
      <div
        onClick={handleTap}
        className="absolute inset-0 cursor-pointer"
      >
        <FeedMedia post={post} active={active} />
      </div>

      {/* 🌑 GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      {/* ❤️ BURST ANIMAATIO */}
      {burst && (
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-30"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.6, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl">❤️</div>
        </motion.div>
      )}

      {/* 📄 CONTENT */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 pb-56">

        {/* 🔥 BOOST BADGE */}
        {isBoosted && (
          <div className="mb-2 text-[10px] font-black uppercase text-cyan-300">
            🔥 Boostattu
          </div>
        )}

        {/* AI SCORE */}
        <div className="mb-2 text-[11px] font-black uppercase text-cyan-200">
          {ai}%
        </div>

        {/* 🧾 TEXT */}
        <div className="relative max-h-[52vh] max-w-[80%] overflow-y-auto pr-2">

          <p
            className={`${textClass} font-black text-white leading-tight drop-shadow-[0_6px_30px_rgba(0,0,0,0.95)]`}
          >
            {post?.content}
          </p>

          {/* fade */}
          <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* 👤 USER */}
        <div className="mt-4 flex items-center gap-3 text-white/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            {avatar}
          </div>
          {author}
        </div>
      </div>

      {/* 🎯 BUTTONS */}
      <div className="absolute right-4 bottom-20 z-20 flex flex-col gap-4">

        <button
          onClick={onLike}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-cyan-500/40 text-white text-xl active:scale-90 transition"
        >
          ♥
        </button>

        <button
          onClick={onShare}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-cyan-500/40 text-white text-xl active:scale-90 transition"
        >
          ↗
        </button>

        <button
          onClick={onMoney}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-cyan-500/40 text-white text-xl active:scale-90 transition"
        >
          €
        </button>

      </div>

      {/* 🎥 PROGRESS BAR */}
      {active && (
        <div className="absolute top-0 left-0 h-[3px] w-full bg-white/20">
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
