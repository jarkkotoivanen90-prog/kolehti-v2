import { motion } from "framer-motion";
import FeedMedia from "./FeedMedia";
import { getScore, getVotes, getShares, getAuthor, getAvatar } from "./utils/feedFormatters";

function getTextSize(content = "") {
  const length = String(content || "").length;
  if (length > 360) return "text-[clamp(1.18rem,4.9vw,2.15rem)] leading-[1.12]";
  if (length > 220) return "text-[clamp(1.38rem,5.6vw,2.55rem)] leading-[1.1]";
  if (length > 120) return "text-[clamp(1.58rem,6.4vw,3rem)] leading-[1.08]";
  return "text-[clamp(1.9rem,7.4vw,3.55rem)] leading-[1.04]";
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
  const trending = likes >= 5 || shares >= 2 || post?.viral_score >= 70;
  const confidence = getConfidenceLabel(ai);

  return (
    <section className="relative h-[100dvh] snap-start overflow-hidden bg-[#050816]">
      <FeedMedia post={post} active={active} />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.055),rgba(0,0,0,.005)_38%,rgba(0,0,0,.34)),linear-gradient(to_bottom,rgba(34,211,238,.045),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/42 via-black/8 to-transparent" />

      {active && trending && (
        <div className="pointer-events-none absolute inset-x-10 top-24 h-28 rounded-full bg-cyan-400/10 blur-3xl" />
      )}

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+112px)] left-0 right-0 top-[calc(env(safe-area-inset-top)+106px)] z-10 px-4">
        <motion.article
          initial={false}
          animate={{ y: active ? 0 : 24, opacity: active ? 1 : 0.72, scale: active ? 1 : 0.985 }}
          transition={{ type: "spring", stiffness: 230, damping: 27 }}
          className="relative flex h-full flex-col overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,rgba(255,255,255,.045),rgba(255,255,255,.004)_45%,rgba(34,211,238,.025))] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.075),0_22px_60px_rgba(0,0,0,.16),0_0_34px_rgba(34,211,238,.055)] backdrop-blur-0"
        >
          <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-100/12 to-transparent" />

          <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
            {index === 0 && <Badge tone="yellow">🏆 johtaja</Badge>}
            {trending && <Badge tone="cyan">🔥 trendaa</Badge>}
            <Badge tone="cyan">🧠 {ai}% · {confidence}</Badge>
            <Badge>❤️ {likes}</Badge>
            <Badge>↗ {shares}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-lg font-black shadow-[inset_0_0_0_1px_rgba(165,243,252,.22),0_0_20px_rgba(34,211,238,.13)]">{avatar}</div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-black tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,.75)]">{author}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/68">
                {post?.bot ? "AI-pelibotti" : `#${index + 1} päivän perustelu`}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.88 }}
              animate={liked ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={{ duration: 0.22 }}
              type="button"
              onClick={(event) => { event.stopPropagation(); onLike?.(); }}
              className={`grid h-13 w-13 place-items-center rounded-full text-xl font-black shadow-[inset_0_0_0_1px_rgba(165,243,252,.22),0_0_26px_rgba(34,211,238,.18)] backdrop-blur-md transition active:scale-95 ${liked ? "bg-pink-500/24 text-pink-50 shadow-[inset_0_0_0_1px_rgba(251,207,232,.30),0_0_26px_rgba(244,114,182,.20)]" : "bg-cyan-400/12 text-white"}`}
              aria-label="Tykkää tai anna ääni"
            >♥</motion.button>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <p className={`${textClass} pb-5 font-black tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,.92)]`}>
              {post?.content}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-[10px] font-black uppercase tracking-[0.13em]">
            <ActionButton onClick={onExplain}>miksi</ActionButton>
            <ActionButton onClick={onShare}>{shared ? "jaettu" : "jaa"}</ActionButton>
            <ActionButton onClick={onMoney}>potti</ActionButton>
            <ActionButton onClick={onLike}>ääni</ActionButton>
          </div>
        </motion.article>
      </div>
    </section>
  );
}

function ActionButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={(event) => { event.stopPropagation(); onClick?.(); }}
      className="rounded-2xl bg-cyan-400/11 px-2 py-3 text-white shadow-[inset_0_0_0_1px_rgba(165,243,252,.20),0_0_20px_rgba(34,211,238,.10)] backdrop-blur-md transition active:scale-95 active:bg-cyan-400/18"
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = "white" }) {
  const toneClass = tone === "yellow"
    ? "bg-yellow-300/10 text-yellow-100 shadow-[inset_0_0_0_1px_rgba(254,240,138,.18)]"
    : tone === "cyan"
      ? "bg-cyan-300/10 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(165,243,252,.18)]"
      : "bg-white/7 text-white/86 shadow-[inset_0_0_0_1px_rgba(255,255,255,.10)]";

  return (
    <span className={`rounded-full px-3 py-1 shadow-black/10 backdrop-blur-md ${toneClass}`}>
      {children}
    </span>
  );
}
