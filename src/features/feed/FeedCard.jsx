import { motion } from "framer-motion";
import FeedMedia from "./FeedMedia";
import GameControls from "../../components/GameControls";
import { getScore, getVotes, getShares, getAuthor, getAvatar } from "./utils/feedFormatters";

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

export default function FeedCard({ post, active, index, liked, shared, onLike, onShare, onExplain, onMoney }) {
  const author = getAuthor(post);
  const avatar = getAvatar(post);
  const likes = getVotes(post) + (liked ? 1 : 0);
  const shares = getShares(post) + (shared ? 1 : 0);
  const ai = Math.max(0, Math.min(99, getScore(post)));
  const textClass = getTextSize(post?.content);
  const confidence = getConfidenceLabel(ai);

  return (
    <section className="relative h-[100dvh] snap-start overflow-hidden bg-[#050816]">
      <FeedMedia post={post} active={active} />

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />

      <div className="absolute inset-x-0 bottom-[120px] top-[110px] px-4 z-10">
        <article className="flex h-full flex-col rounded-[30px] p-4 backdrop-blur-xl border border-white/10 bg-white/5">

          {/* HEADER */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-cyan-500/20 text-white font-bold">
              {avatar}
            </div>
            <div className="flex-1">
              <div className="font-black text-lg truncate">{author}</div>
              <div className="text-xs text-white/60 uppercase tracking-wider">
                {post?.bot ? "AI-pelibotti" : `#${index + 1} perustelu`}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onLike?.(); }}
              className="w-12 h-12 rounded-full bg-cyan-500/30 flex items-center justify-center text-xl"
            >♥</motion.button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto">
            <p className={`${textClass} font-black text-white`}>
              {post?.content}
            </p>
          </div>

          {/* 🔥 NEW: ENTRY + BOOST */}
          <div className="mt-3">
            <GameControls postId={post.id} />
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-4 gap-2 mt-3 text-xs uppercase font-bold">
            <ActionButton onClick={onExplain}>miksi</ActionButton>
            <ActionButton onClick={onShare}>{shared ? "jaettu" : "jaa"}</ActionButton>
            <ActionButton onClick={onMoney}>potti</ActionButton>
            <ActionButton onClick={onLike}>ääni</ActionButton>
          </div>

          {/* STATS */}
          <div className="flex justify-between mt-2 text-xs text-white/60">
            <span>🧠 {ai}% ({confidence})</span>
            <span>❤️ {likes}</span>
            <span>↗ {shares}</span>
          </div>

        </article>
      </div>
    </section>
  );
}

function ActionButton({ children, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className="bg-cyan-500/20 border border-cyan-400/30 rounded-xl py-2 active:scale-95"
    >
      {children}
    </button>
  );
}
