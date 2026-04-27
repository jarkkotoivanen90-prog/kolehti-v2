import { useEffect, useState } from "react";
import CharacterAvatar from "./CharacterAvatar";
import AlmostWinBadge from "./AlmostWinBadge";
import { characters } from "../data/characters";
import { increaseView, trackEvent } from "../lib/tiktokAI";
import { getBoostSignal } from "../lib/boostSignals";
import { boostPostWithXp, getWinHint } from "../lib/postBoosts";

export default function ForYouCard({
  post,
  index,
  user,
  voted,
  onVote,
  rankInfo,
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [boostMsg, setBoostMsg] = useState(null);

  const character = characters[index % characters.length];
  const boostSignal = getBoostSignal(post);
  const winHint = getWinHint(rankInfo);

  useEffect(() => {
    increaseView(post.id);

    trackEvent({
      userId: user?.id,
      postId: post.id,
      type: "view",
      weight: 1,
    });
  }, [post.id, user?.id]);

  async function handleVote() {
    if (voted) return;

    setShowHeart(true);
    navigator.vibrate?.(45);

    await trackEvent({
      userId: user?.id,
      postId: post.id,
      type: "vote_click",
      weight: 5,
    });

    await onVote(post);

    setTimeout(() => setShowHeart(false), 800);
  }

  async function handleBoost() {
    if (!user?.id || boosting) return;

    setBoosting(true);
    const res = await boostPostWithXp({ userId: user.id, post });
    setBoostMsg(res.message);

    navigator.vibrate?.(35);

    setTimeout(() => setBoostMsg(null), 2500);
    setBoosting(false);
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);

    await trackEvent({
      userId: user?.id,
      postId: post.id,
      type: "share",
      weight: 8,
    });

    navigator.vibrate?.(25);
  }

  return (
    <article className="relative min-h-[72vh] snap-start overflow-hidden rounded-[38px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
      {showHeart && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 animate-ping text-8xl">
          💗
        </div>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2563eb55,transparent_45%)]" />
      <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative z-10 flex min-h-[68vh] flex-col">
        <div className="flex items-center justify-between">
          <CharacterAvatar
            character={character}
            size="lg"
            showInfo={false}
            rank={index + 1}
          />

          <div className="rounded-2xl bg-black/30 px-4 py-2 text-right">
            <div className="text-xs font-black text-white/50">VIRAL</div>
            <div className="text-lg font-black text-cyan-200">
              {Math.round(post.growth_score || 0)}
            </div>
          </div>
        </div>

        <div className="mt-auto">
          {winHint && (
            <div className="mb-3 rounded-2xl border border-yellow-300/30 bg-yellow-400/15 px-4 py-3 text-sm font-black text-yellow-100">
              {winHint}
            </div>
          )}

          {boostSignal.bonus > 0 && (
            <div className="mb-3 rounded-3xl border border-yellow-300/30 bg-yellow-400/15 px-4 py-3 text-sm font-black text-yellow-100">
              {boostSignal.label === "HOT" && "🔥 Kuuma postaus"}
              {boostSignal.label === "RISING" && "🚀 Nousemassa"}
              {boostSignal.label === "QUALITY" && "🤖 Vahva AI-signaali"}
              {boostSignal.label === "BOOST" && "⚡ Boost päällä"}
              <span className="ml-2 text-yellow-200">+{boostSignal.bonus}</span>
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-yellow-400/90 px-3 py-1 text-xs font-black text-black">
              {post.growth_reason || "✨ Uusi"}
            </span>

            {post.ai_signal && (
              <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-black text-cyan-100">
                🤖 AI {Math.round(post.ai_signal)}
              </span>
            )}

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
              💗 {post.vote_count || 0}
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
              👀 {post.view_count || 0}
            </span>
          </div>

          <h2 className="text-3xl font-black">Perustelu</h2>

          <p className="mt-3 whitespace-pre-wrap text-xl font-bold leading-relaxed text-white/85">
            {post.content}
          </p>

          <AlmostWinBadge rankInfo={rankInfo} />

          {boostMsg && (
            <div className="mt-3 rounded-xl bg-black/40 px-3 py-2 text-sm font-black text-white">
              {boostMsg}
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3">
            <button
              onClick={handleVote}
              disabled={voted}
              className={`rounded-3xl px-4 py-4 text-lg font-black ${
                voted ? "bg-white/15 text-white/50" : "bg-pink-500 text-white"
              }`}
            >
              💗
            </button>

            <button
              onClick={handleBoost}
              disabled={boosting}
              className="rounded-3xl bg-yellow-400 px-4 py-4 text-lg font-black text-black"
            >
              ⚡
            </button>

            <button
              onClick={handleShare}
              className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-lg font-black"
            >
              🚀
            </button>
          </div>

          {!voted && index > 0 && (
            <div className="mt-4 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-3 text-sm font-black text-yellow-100">
              ⚡ Tämä voi nousta. Yksi ääni voi muuttaa rankingin.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
