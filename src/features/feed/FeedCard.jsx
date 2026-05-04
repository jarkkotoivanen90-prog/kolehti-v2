import { motion } from "framer-motion";
import FeedMedia from "./FeedMedia";
import {
  getScore,
  getVotes,
  getShares,
  getAuthor,
  getAvatar,
} from "./utils/feedFormatters";

// 📏 TEKSTIN SKAALAUS
function getTextSize(content = "") {
  const length = String(content || "").length;
  if (length > 360) return "text-[clamp(1.2rem,4.8vw,2rem)] leading-[1.2]";
  if (length > 220) return "text-[clamp(1.4rem,5.5vw,2.4rem)] leading-[1.15]";
  if (length > 120) return "text-[clamp(1.6rem,6.2vw,2.8rem)] leading-[1.1]";
  return "text-[clamp(1.9rem,7vw,3.2rem)] leading-[1.05]";
}

// 🏷 BADGE
function Badge({ children }) {
  return (
    <span className="px-3 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-none">
      {children}
    </span>
  );
}

export default function FeedCard({
  post,
  active,
  index,
  liked,
  shared,
  onLike,
  onShare,
  onExplain,
  onMoney,
}) {
  const author = getAuthor(post);
  const avatar = getAvatar(post);
  const likes = getVotes(post) + (liked ? 1 : 0);
  const shares = getShares(post) + (shared ? 1 : 0);
  const ai = Math.max(0, Math.min(99, getScore(post)));
  const textClass = getTextSize(post?.content);
  const trending = likes >= 5 || shares >= 2 || post?.viral_score >= 70;

  return (
    <section className="relative h-[100dvh] snap-start overflow-hidden bg-black">
      
      {/* 🎥 FULLSCREEN MEDIA */}
      <FeedMedia post={post} active={active} />

      {/* 🌑 GRADIENT OVERLAY (EI BLURIA) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />

      {/* 📄 CONTENT */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 pb-24">

        {/* BADGES */}
        <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-black uppercase">
          {index === 0 && <Badge>johtaja</Badge>}
          {trending && <Badge>trendaa</Badge>}
          <Badge>{ai}%</Badge>
          <Badge>{likes}</Badge>
        </div>

        {/* TEKSTI */}
        <p className={`${textClass} font-black text-white drop-shadow-xl`}>
          {post?.content}
        </p>

        {/* USER */}
        <div className="mt-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-lg font-black">
            {avatar}
          </div>
          <div className="text-sm font-bold text-white/80">
            {author}
          </div>
        </div>

      </div>

      {/* 🎯 FLOATING ACTIONS */}
      <div className="absolute right-4 bottom-28 flex flex-col gap-3 z-20">

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onLike}
          className="w-14 h-14 rounded-full bg-black/50 text-white text-xl flex items-center justify-center"
        >
          ♥
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onShare}
          className="w-14 h-14 rounded-full bg-black/50 text-white text-xl flex items-center justify-center"
        >
          ↗
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onMoney}
          className="w-14 h-14 rounded-full bg-black/50 text-white text-xl flex items-center justify-center"
        >
          €
        </motion.button>

      </div>

      {/* OPTIONAL: TAP AREA */}
      <div
        className="absolute inset-0 z-0"
        onClick={() => onExplain?.()}
      />
    </section>
  );
}
