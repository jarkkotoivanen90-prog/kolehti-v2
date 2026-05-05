import { useState } from "react";
import { motion } from "framer-motion";
import FeedMedia from "./FeedMedia";
import {
  getAuthor,
  getAvatar,
  getVotes,
  getScore,
} from "./utils/feedFormatters";
import { whyForYou } from "../../lib/godFeed";

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
  const votes = getVotes(post);
  const ai = getScore(post);

  const [showHeart, setShowHeart] = useState(false);

  const text = post?.content || "";
  const [firstLine, ...rest] = text.split(". ");

  function handleDoubleTap() {
    onLike?.();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 600);
  }

  return (
    <motion.section
      onDoubleClick={handleDoubleTap}
      initial={{ scale: 0.96 }}
      animate={{ scale: active ? 1 : 0.96 }}
      transition={{ duration: 0.25 }}
      className="relative h-[100dvh] snap-start overflow-hidden bg-black"
    >
      {/* 🎥 MEDIA */}
      <FeedMedia post={post} active={active} />

      {/* 🌑 GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* ❤️ DOUBLE TAP */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-6xl animate-ping z-30">
          ❤️
        </div>
      )}

      {/* 📄 CONTENT */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end px-5 pb-32">

        {/* 🔥 AI META */}
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          {post?.boost && (
            <span className="text-orange-400">🔥 Boostattu</span>
          )}
          <span className="text-white/80">{ai}%</span>
          <span className="text-cyan-300">
            {whyForYou(post)}
          </span>
        </div>

        {/* 🧠 TEXT */}
        <div className="max-h-[50vh] overflow-y-auto pr-1">

          {/* HOOK */}
          <p className="text-[clamp(2.2rem,7vw,3.2rem)] font-black leading-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            {firstLine}.
          </p>

          {/* BODY */}
          {rest.length > 0 && (
            <p className="mt-2 text-[clamp(1.3rem,4.5vw,1.9rem)] text-white/90 leading-snug">
              {rest.join(". ")}
            </p>
          )}

        </div>

        {/* 👤 USER */}
        <div className="mt-4 flex items-center gap-3 text-white/80">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            {avatar}
          </div>
          <span className="font-semibold">{author}</span>
        </div>

      </div>

      {/* 🎯 ACTIONS (siirretty alemmas) */}
      <div className="absolute right-4 bottom-[12vh] flex flex-col gap-3 z-30">

        <button
          onClick={onLike}
          className="w-12 h-12 rounded-full bg-[rgba(14,165,255,0.25)] border border-[rgba(139,238,255,0.4)] text-white text-lg backdrop-blur-md active:scale-90 transition"
        >
          ♥
        </button>

        <button
          onClick={onShare}
          className="w-12 h-12 rounded-full bg-[rgba(14,165,255,0.25)] border border-[rgba(139,238,255,0.4)] text-white text-lg backdrop-blur-md active:scale-90 transition"
        >
          ↗
        </button>

        <button
          onClick={onMoney}
          className="w-12 h-12 rounded-full bg-[rgba(14,165,255,0.25)] border border-[rgba(139,238,255,0.4)] text-white text-lg backdrop-blur-md active:scale-90 transition"
        >
          €
        </button>

      </div>
    </motion.section>
  );
}
