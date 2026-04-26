import { useEffect, useState } from "react";
import CharacterAvatar from "./CharacterAvatar";
import { characters } from "../data/characters";
import { increaseView, trackEvent } from "../lib/tiktokAI";

export default function ForYouCard({ post, index, user, voted, onVote }) {
  const [showHeart, setShowHeart] = useState(false);
  const character = characters[index % characters.length];

  useEffect(() => {
    increaseView(post.id);

    trackEvent({
      userId: user?.id,
      postId: post.id,
      type: "view",
      weight: 1,
    });
  }, [post.id]);

  async function handleVote() {
    setShowHeart(true);
    navigator.vibrate?.(45);

    await trackEvent({
      userId: user?.id,
      postId: post.id,
      type: "vote_click",
      weight: 5,
    });

    onVote(post);

    setTimeout(() => setShowHeart(false), 800);
  }

  return (
    <article className="relative min-h-[72vh] snap-start overflow-hidden rounded-[38px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
      {showHeart && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 animate-ping text-8xl">
          💗
        </div>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2563eb55,transparent_45%)]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between">
          <CharacterAvatar
            character={character}
            size="lg"
            showInfo={false}
            rank={index + 1}
          />

          <div className="rounded-2xl bg-black/30 px-4 py-2 text-right">
            <div className="text-xs font-black text-white/50">FOR YOU</div>
            <div className="text-lg font-black text-cyan-200">
              {Math.round(post.for_you_score || 0)}
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <div className="mb-3 flex flex-wrap gap-2">
            {index === 0 && (
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black">
                🏆 Kärjessä
              </span>
            )}

            {post.ai_score > 70 && (
              <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-black text-cyan-100">
                🤖 AI vahva
              </span>
            )}

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/70">
              💗 {post.vote_count || 0}
            </span>
          </div>

          <h2 className="text-3xl font-black">Perustelu</h2>

          <p className="mt-3 whitespace-pre-wrap text-xl font-bold leading-relaxed text-white/85">
            {post.content}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={handleVote}
              disabled={voted}
              className={`rounded-3xl px-5 py-5 text-xl font-black shadow-2xl transition active:scale-95 ${
                voted
                  ? "bg-white/15 text-white/50"
                  : "bg-pink-500 text-white shadow-pink-500/30"
              }`}
            >
              {voted ? "Äänestetty" : "💗 Äänestä"}
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                trackEvent({
                  userId: user?.id,
                  postId: post.id,
                  type: "share",
                  weight: 8,
                });
              }}
              className="rounded-3xl border border-white/10 bg-white/10 px-5 py-5 text-xl font-black transition active:scale-95"
            >
              🚀 Jaa
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
