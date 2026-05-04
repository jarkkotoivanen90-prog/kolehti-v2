import { motion } from "framer-motion";
import FeedMedia from "./FeedMedia";
import {
  getScore,
  getVotes,
  getShares,
  getAuthor,
  getAvatar,
} from "./utils/feedFormatters";

function getTextSize(content = "") {
  const length = String(content || "").length;
  if (length > 360) return "text-[clamp(1.16rem,4.8vw,2.1rem)] leading-[1.14]";
  if (length > 220) return "text-[clamp(1.34rem,5.5vw,2.48rem)] leading-[1.12]";
  if (length > 120) return "text-[clamp(1.54rem,6.25vw,2.9rem)] leading-[1.09]";
  return "text-[clamp(1.84rem,7.15vw,3.42rem)] leading-[1.05]";
}

function getConfidenceLabel(score) {
  if (score >= 88) return "vahva";
  if (score >= 72) return "hyvä";
  if (score >= 52) return "nousee";
  return "uusi";
}

// 🔥 CLEAN GLASS (EI SUMUA)
const glass = {
  background: "rgba(255,255,255,0.006)",
  backdropFilter: "blur(14px) saturate(140%)",
  WebkitBackdropFilter: "blur(14px) saturate(140%)",
  border: "1px solid rgba(255,255,255,0.28)",
  boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
};

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
  const confidence = getConfidenceLabel(ai);

  return (
    <section className="relative h-[100dvh] snap-start overflow-hidden bg-transparent">
      {/* 🎥 TAUSTA */}
      <FeedMedia post={post} active={active} />

      {/* 🧊 GLASS UI */}
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+100px)] bottom-[calc(env(safe-area-inset-bottom)+110px)] z-10 px-4">
        <article
          className={`flex h-full flex-col rounded-[34px] p-5 transition-opacity duration-200 ${
            active ? "opacity-100" : "opacity-90"
          }`}
          style={glass}
        >
          {/* 🔝 BADGES */}
          <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide">
            {index === 0 && <Badge>johtaja</Badge>}
            {trending && <Badge>trendaa</Badge>}
            <Badge>{ai}% {confidence}</Badge>
            <Badge>{likes}</Badge>
            <Badge>{shares}</Badge>
          </div>

          {/* 👤 HEADER */}
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-lg font-black">
              {avatar}
            </div>

            <div className="flex-1 min-w-0">
              <div className="truncate text-lg font-black">
                {author}
              </div>
              <div className="text-[10px] uppercase text-white/70">
                {post?.bot ? "AI-pelibotti" : `#${index + 1}`}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center font-black"
            >
              ♥
            </motion.button>
          </div>

          {/* 📝 CONTENT */}
          <div className="mt-5 flex-1 overflow-y-auto">
            <p className={`${textClass} font-black text-white`}>
              {post?.content}
            </p>
          </div>

          {/* 🔘 ACTIONS */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs font-black uppercase">
            <ActionButton onClick={onExplain}>miksi</ActionButton>
            <ActionButton onClick={onShare}>
              {shared ? "jaettu" : "jaa"}
            </ActionButton>
            <ActionButton onClick={onMoney}>potti</ActionButton>
            <ActionButton onClick={onLike}>ääni</ActionButton>
          </div>
        </article>
      </div>
    </section>
  );
}

// 🔘 BUTTON
function ActionButton({ children, onClick }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="rounded-2xl py-3 bg-white/10 border border-white/20 active:scale-[0.97]"
    >
      {children}
    </button>
  );
}

// 🏷 BADGE
function Badge({ children }) {
  return (
    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">
      {children}
    </span>
  );
}
