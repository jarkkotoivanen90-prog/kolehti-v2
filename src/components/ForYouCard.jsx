import React from "react";
import AlmostWinBadge from "./AlmostWinBadge";

export default function ForYouCard({
  post,
  index,
  user,
  voted,
  onVote,
  rankInfo,
}) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4 mb-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-400">#{index}</span>
        <span className="text-xs text-zinc-500">
          {post.createdAt || "just now"}
        </span>
      </div>

      {/* Content */}
      <p className="text-white text-base mb-3">{post.text}</p>

      {/* 🔥 Almost Win Badge */}
      {rankInfo && <AlmostWinBadge rankInfo={rankInfo} />}

      {/* Actions */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => onVote(post)}
          className={`px-3 py-1 rounded-xl text-sm ${
            voted
              ? "bg-green-500 text-black"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          }`}
        >
          {voted ? "Voted" : "Vote"}
        </button>

        <span className="text-zinc-400 text-sm">
          {post.votes || 0} votes
        </span>
      </div>
    </div>
  );
}
