import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CharacterAvatar from "./CharacterAvatar";
import AlmostWinBadge from "./AlmostWinBadge";
import { characters } from "../data/characters";
import { increaseView, trackEvent } from "../lib/tiktokAI";
import { getBoostSignal } from "../lib/boostSignals";
import { boostPostWithXp, getWinHint, getSocialProof } from "../lib/postBoosts";
import { trackSessionEvent } from "../lib/sessionAI";

export default function ForYouCard({
  post,
  index,
  user,
  voted,
  onVote,
  rankInfo,
}) {
  const [showHeart, setShowHeart] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [boostMsg, setBoostMsg] = useState(null);

  const isStarter = Boolean(post?.is_starter);
  const character = characters[index % characters.length];
  const boostSignal = isStarter ? null : getBoostSignal(post);
  const winHint = isStarter ? "✨ Malliperustelu — tee oma ja nouse oikeaan kilpailuun." : getWinHint(rankInfo);
  const socialProof = isStarter ? "AI-mallisisältö näyttää millainen perustelu toimii." : getSocialProof(post);
  const isTopRank = !isStarter && rankInfo?.rank && rankInfo.rank <= 3;

  useEffect(() => {
    if (isStarter) return;

    increaseView(post.id);
    trackSessionEvent(post, "view");

    trackEvent({
      userId: user?.id,
      postId: post.id,
      type: "view",
      weight: 1,
    });

    const start = Date.now();

    return () => {
      const duration = Date.now() - start;

      if (duration > 3000) {
        trackSessionEvent(post, "deep_view");
      }
    };
  }, [post.id, user?.id, isStarter]);

  async function handleVote() {
    if (isStarter) {
      await onVote(post);
      return;
    }

    if (voted) return;

    setShowHeart(true);
    setShowXP(true);
    navigator.vibrate?.([20, 40, 20]);
    trackSessionEvent(post, "vote");

    await trackEvent({
      userId: user?.id,
      postId: post.id,
      type: "vote_click",
      weight: 5,
    });

    await onVote(post);

    setTimeout(() => setShowHeart(false), 800);
    setTimeout(() => setShowXP(false), 900);
  }

  async function handleBoost() {
    if (isStarter) {
      setBoostMsg("Luo oma perustelu — boostit kuuluvat oikeille postauksille.");
      setTimeout(() => setBoostMsg(null), 2200);
      return;
    }

    if (!user?.id || boosting) return;

    setBoosting(true);
    trackSessionEvent(post, "boost");
    const res = await boostPostWithXp({ userId: user.id, post });
    setBoostMsg(res.message);

    navigator.vibrate?.(35);

    setTimeout(() => setBoostMsg(null), 2500);
    setBoosting(false);
  }

  async function handleShare() {
    if (isStarter) {
      setBoostMsg("Jaa peli vasta kun olet tehnyt oman perustelun.");
      setTimeout(() => setBoostMsg(null), 2200);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    trackSessionEvent(post, "share");

    await trackEvent({
      userId: user?.id,
      postId: post.id,
      type: "share",
      weight: 8,
    });

    navigator.vibrate?.(25);
  }

  return (
    <article className={`relative min-h-[72vh] snap-start overflow-hidden rounded-[38px] bg-white/10 p-5 shadow-2xl backdrop-blur-xl ${
      isTopRank
        ? "border-2 border-yellow-300 shadow-[0_0_35px_rgba(250,204,21,0.35)]"
        : isStarter
          ? "border-2 border-cyan-300/30"
          : "border border-white/10"
    }`}>
      {showHeart && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 animate-ping text-8xl">
          💗
        </div>
      )}

      {showXP && (
        <div className="pointer-events-none absolute right-8 top-24 z-30 animate-bounce rounded-full border border-cyan-300/30 bg-cyan-500/20 px-4 py-2 text-sm font-black text-cyan-100 shadow-2xl backdrop-blur-xl">
          +5 XP
        </div>
      )}

      {isStarter && (
        <div className="pointer-events-none absolute right-5 top-5 z-20 rounded-full border border-cyan-300/30 bg-cyan-400/20 px-3 py-1 text-xs font-black text-cyan-100 backdrop-blur-xl">
          🤖 AI MALLI
        </div>
      )}

      {isTopRank && (
        <div className="pointer-events-none absolute right-5 top-5 z-20 rounded-full border border-yellow-300/30 bg-yellow-400/20 px-3 py-1 text-xs font-black text-yellow-100 backdrop-blur-xl">
          🔥 TOP {rankInfo.rank}
        </div>
      )}

      <div className="relative z-10 flex min-h-[68vh] flex-col">
        <div className="flex items-center justify-between">
          <CharacterAvatar character={character} size="lg" showInfo={false} rank={index + 1} />

          <div className="rounded-2xl bg-black/30 px-4 py-2 text-right">
            <div className="text-xs font-black text-white/50">{isStarter ? "MALLI" : "VIRAL"}</div>
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

          <div className="mb-2 text-xs font-bold text-white/60">
            {socialProof}
          </div>

          <h2 className="text-3xl font-black">{isStarter ? "Malliperustelu" : "Perustelu"}</h2>

          <p className="mt-3 whitespace-pre-wrap text-xl font-bold leading-relaxed text-white/85">
            {post.content}
          </p>

          {!isStarter && <AlmostWinBadge rankInfo={rankInfo} />}

          {boostMsg && (
            <div className="mt-3 rounded-xl bg-black/40 px-3 py-2 text-sm font-black text-white">
              {boostMsg}
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3">
            {isStarter ? (
              <Link to="/new" className="col-span-2 rounded-3xl bg-cyan-500 px-4 py-4 text-center text-lg font-black text-white shadow-xl shadow-cyan-500/25">
                Luo oma
              </Link>
            ) : (
              <button onClick={handleVote} disabled={voted} className={`relative rounded-3xl px-4 py-4 text-lg font-black ${voted ? "bg-white/15 text-white/50" : "bg-pink-500 text-white shadow-xl shadow-pink-500/25"}`}>
                💗
              </button>
            )}

            <button onClick={handleBoost} disabled={boosting} className="rounded-3xl bg-yellow-400 px-4 py-4 text-lg font-black text-black shadow-xl shadow-yellow-400/20">
              ⚡
            </button>

            {!isStarter && (
              <button onClick={handleShare} className="rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-lg font-black">
                🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
