import { motion } from "framer-motion";
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

export default function FeedCard({
  post,
  active,
  index,
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

  return (
    <motion.section
      initial={{ scale: 0.96 }}
      animate={{ scale: active ? 1 : 0.96 }}
      transition={{ duration: 0.3 }}
      className="relative h-[100dvh] snap-start overflow-hidden bg-black"
    >
      {/* 🎥 MEDIA */}
      <FeedMedia post={post} active={active} />

      {/* 🌑 CLEAN GRADIENT (EI BLOKKIA) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      {/* 📄 CONTENT */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 pb-48">

        {/* AI SCORE */}
        <div className="text-[11px] font-black uppercase text-cyan-200 mb-2">
          {ai}%
        </div>

        {/* 🧾 SCROLL TEXT */}
        <div className="max-h-[52vh] overflow-y-auto pr-2">

          <p
            className={`${textClass} font-black text-white leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]`}
          >
            {post?.content}
          </p>

        </div>

        {/* 👤 USER */}
        <div className="mt-4 flex items-center gap-3 text-white/80">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            {avatar}
          </div>
          {author}
        </div>

      </div>

      {/* 🎯 FLOATING BUTTONS */}
      <div className="absolute right-4 bottom-16 flex flex-col gap-3 z-20">

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
    </motion.section>
  );
}
