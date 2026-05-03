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

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.045),rgba(0,0,0,.004)_40%,rgba(0,0,0,.30)),linear-gradient(to_bottom,rgba(var(--feed-accent),.040),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/36 via-black/7 to-transparent" />

      {active && trending && (
        <div className="pointer-events-none absolute inset-x-10 top-24 h-28 rounded-full blur-3xl" style={{ background: "var(--feed-accent-bg)" }} />
      )}

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+112px)] left-0 right-0 top-[calc(env(safe-area-inset-top)+106px)] z-10 px-4">
        <motion.article
          initial={false}
          animate={{ y: active ? 0 : 24, opacity: active ? 1 : 0.72, scale: active ? 1 : 0.985 }}
          transition={{ type: "spring", stiffness: 230, damping: 27 }}
          className="relative flex h-full flex-col overflow-hidden rounded-[34px] p-4 backdrop-blur-0"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,.036), rgba(255,255,255,.003) 48%, rgba(var(--feed-accent-soft), .02))",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.055), 0 22px 60px rgba(0,0,0,.13), 0 0 34px var(--feed-accent-glow-soft)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(255,255,255,.045)_100%)] opacity-60" />

          <div className="relative mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
            {index === 0 && <Badge>🏆 johtaja</Badge>}
            {trending && <Badge>🔥 trendaa</Badge>}
            <Badge>🧠 {ai}% · {confidence}</Badge>
            <Badge>❤️ {likes}</Badge>
            <Badge>↗ {shares}</Badge>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-black" style={{ background: "var(--feed-accent-bg)", boxShadow: "0 0 18px var(--feed-accent-glow)" }}>{avatar}</div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-black tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,.75)]">{author}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                {post?.bot ? "AI-pelibotti" : `#${index + 1} päivän perustelu`}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.88 }}
              animate={liked ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={{ duration: 0.22 }}
              type="button"
              onClick={(event) => { event.stopPropagation(); onLike?.(); }}
              className="grid h-13 w-13 place-items-center rounded-full text-xl font-black backdrop-blur-md transition active:scale-95"
              style={{ background: "var(--feed-accent-bg-strong)", boxShadow: "0 0 24px var(--feed-accent-glow)" }}
            >♥</motion.button>
          </div>

          <div className="relative mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            <p className={`${textClass} pb-5 font-black tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,.92)]`}>
              {post?.content}
            </p>
          </div>

          <div className="relative mt-3 grid grid-cols-4 gap-2 text-[10px] font-black uppercase tracking-[0.13em]">
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
      className="rounded-2xl px-2 py-3 text-white backdrop-blur-md transition active:scale-95"
      style={{
        background: "var(--feed-accent-bg-strong)",
        boxShadow: "0 0 18px var(--feed-accent-glow)",
        border: "1px solid var(--feed-accent-border)",
      }}
    >
      {children}
    </button>
  );
}

function Badge({ children }) {
  return (
    <span
      className="rounded-full px-3 py-1 backdrop-blur-md"
      style={{
        background: "var(--feed-accent-bg)",
        border: "1px solid var(--feed-accent-border)",
      }}
    >
      {children}
    </span>
  );
}
