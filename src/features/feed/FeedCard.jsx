import { motion } from "framer-motion";
import FeedMedia from "./FeedMedia";
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

const transparentGlassStyle = {
  background: "rgba(255,255,255,0.018)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",
  border: "1px solid rgba(255,255,255,0.24)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
};

export default function FeedCard({ post, active, index, liked, shared, onLike, onShare, onExplain, onMoney }) {
  const author = getAuthor(post);
  const avatar = getAvatar(post);
  const likes = getVotes(post) + (liked ? 1 : 0);
  const shares = getShares(post) + (shared ? 1 : 0);
  const ai = Math.max(0, Math.min(99, getScore(post)));
  const textClass = getTextSize(post?.content);
  const trending = likes >= 5 || shares >= 2 || post?.viral_score >= 70;
  const confidence = getConfidenceLabel(ai);

  return (
    <section className="relative h-[100dvh] snap-start overflow-hidden bg-[#050816]">
      <FeedMedia post={post} active={active} />

      <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+112px)] top-[calc(env(safe-area-inset-top)+106px)] z-10 px-4">
        <article
          className={`relative flex h-full flex-col overflow-hidden rounded-[34px] p-4 transition-opacity duration-200 ${active ? "opacity-100" : "opacity-85"}`}
          style={transparentGlassStyle}
        >
          <div className="relative mb-3 flex flex-wrap items-center gap-1.5 text-[9.5px] font-black uppercase tracking-[0.15em]">
            {index === 0 && <Badge>🏆 johtaja</Badge>}
            {trending && <Badge>🔥 trendaa</Badge>}
            <Badge>🧠 {ai}% · {confidence}</Badge>
            <Badge>❤️ {likes}</Badge>
            <Badge>↗ {shares}</Badge>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-black" style={{ background: "rgba(14,165,255,0.16)", boxShadow: "0 0 10px rgba(14,165,255,0.18)" }}>{avatar}</div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-black tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,.82)]">{author}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.19em] text-white/74 drop-shadow-[0_2px_6px_rgba(0,0,0,.70)]">
                {post?.bot ? "AI-pelibotti" : `#${index + 1} päivän perustelu`}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              animate={liked ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 0.16 }}
              type="button"
              onClick={(event) => { event.stopPropagation(); onLike?.(); }}
              className="grid h-13 w-13 place-items-center rounded-full text-xl font-black transition active:scale-95"
              style={{ background: "rgba(14,165,255,0.25)", boxShadow: "0 0 14px rgba(14,165,255,0.22)", border: "1px solid rgba(139,238,255,0.24)" }}
            >♥</motion.button>
          </div>

          <div className="relative mt-4 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <p
              className={`${textClass} pb-5 font-black tracking-tight text-white`}
              style={{ textShadow: "0 1px 1px rgba(0,0,0,.50), 0 4px 14px rgba(0,0,0,.88), 0 12px 34px rgba(0,0,0,.62), 0 0 1px rgba(0,0,0,.72)" }}
            >
              {post?.content}
            </p>
          </div>

          <div className="relative mt-3 grid grid-cols-4 gap-2 text-[10px] font-black uppercase tracking-[0.13em]">
            <ActionButton onClick={onExplain}>miksi</ActionButton>
            <ActionButton onClick={onShare}>{shared ? "jaettu" : "jaa"}</ActionButton>
            <ActionButton onClick={onMoney}>potti</ActionButton>
            <ActionButton onClick={onLike}>ääni</ActionButton>
          </div>
        </article>
      </div>
    </section>
  );
}

function ActionButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={(event) => { event.stopPropagation(); onClick?.(); }}
      className="rounded-2xl px-2 py-3 text-white transition active:scale-[0.97] active:brightness-110"
      style={{
        background: "rgba(14,165,255,0.22)",
        boxShadow: "0 0 10px rgba(14,165,255,0.20)",
        border: "1px solid rgba(139,238,255,0.30)",
      }}
    >
      {children}
    </button>
  );
}

function Badge({ children }) {
  return (
    <span
      className="rounded-full px-2.5 py-1"
      style={{
        background: "rgba(14,165,255,0.14)",
        border: "1px solid rgba(139,238,255,0.30)",
      }}
    >
      {children}
    </span>
  );
}
