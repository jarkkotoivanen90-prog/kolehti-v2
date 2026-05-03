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

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.075),rgba(0,0,0,.012)_38%,rgba(0,0,0,.35))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/40 via-black/9 to-transparent" />

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+112px)] left-0 right-0 top-[calc(env(safe-area-inset-top)+106px)] z-10 px-4">
        <article
          className={`relative flex h-full flex-col overflow-hidden rounded-[34px] p-4 transition-opacity duration-200 ${active ? "opacity-100" : "opacity-85"}`}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,.024), rgba(255,255,255,.002) 52%, rgba(var(--feed-accent-soft), .010))",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.042), 0 14px 38px rgba(0,0,0,.11)",
          }}
        >
          <div className="pointer-events-none absolute inset-x-4 top-[29%] h-[48%] rounded-[32px] bg-black/15" />
          <div className="pointer-events-none absolute inset-x-4 bottom-12 h-28 rounded-[32px] bg-gradient-to-t from-black/16 via-black/5 to-transparent" />

          <div className="relative mb-3 flex flex-wrap items-center gap-1.5 text-[9.5px] font-black uppercase tracking-[0.15em]">
            {index === 0 && <Badge>🏆 johtaja</Badge>}
            {trending && <Badge>🔥 trendaa</Badge>}
            <Badge>🧠 {ai}% · {confidence}</Badge>
            <Badge>❤️ {likes}</Badge>
            <Badge>↗ {shares}</Badge>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-black" style={{ background: "var(--feed-accent-bg)", boxShadow: "0 0 10px var(--feed-accent-glow)" }}>{avatar}</div>

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
              style={{ background: "var(--feed-accent-bg-strong)", boxShadow: "0 0 14px var(--feed-accent-glow)" }}
            >♥</motion.button>
          </div>

          <div className="relative mt-4 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <p
              className={`${textClass} pb-5 font-black tracking-tight text-white`}
              style={{ textShadow: "0 2px 0 rgba(0,0,0,.22), 0 5px 15px rgba(0,0,0,.86), 0 0 22px rgba(0,0,0,.45)" }}
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
        background: "var(--feed-accent-bg-strong)",
        boxShadow: "0 0 10px var(--feed-accent-glow)",
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
      className="rounded-full px-2.5 py-1"
      style={{
        background: "var(--feed-accent-bg)",
        border: "1px solid var(--feed-accent-border)",
      }}
    >
      {children}
    </span>
  );
}
