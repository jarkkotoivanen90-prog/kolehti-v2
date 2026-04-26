import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import CharacterAvatar from "./CharacterAvatar";
import { characters } from "../data/characters";

export default function LiveLeaderboard({ posts = [] }) {
  const [livePosts, setLivePosts] = useState(posts);

  useEffect(() => {
    setLivePosts(posts);
  }, [posts]);

  useEffect(() => {
    const channel = supabase
      .channel("live-leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => {
          // FeedPage päivittää varsinaisen datan, tämä pitää leaderboardin live-tilassa.
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const top = livePosts.slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="rounded-[34px] border border-white/10 bg-white/10 p-5 shadow-2xl">
        <h2 className="text-2xl font-black">🏆 Live Leaderboard</h2>
        <p className="mt-2 text-sm font-bold text-white/55">
          Ei vielä sijoituksia. Luo ensimmäinen perustelu.
        </p>

        <Link
          to="/new"
          className="mt-4 block rounded-2xl bg-cyan-500 px-5 py-4 text-center font-black"
        >
          Luo perustelu
        </Link>
      </div>
    );
  }

  return (
    <section className="rounded-[34px] border border-yellow-300/30 bg-yellow-500/10 p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-yellow-200">
            🏆 Live Leaderboard
          </h2>
          <p className="mt-1 text-xs font-bold text-white/55">
            Sijoitukset päivittyvät äänten mukaan.
          </p>
        </div>

        <div className="rounded-full bg-black/30 px-3 py-1 text-xs font-black text-yellow-100">
          LIVE
        </div>
      </div>

      <div className="space-y-3">
        {top.map((post, index) => (
          <div
            key={post.id}
            className={`flex items-center gap-3 rounded-3xl border p-3 ${
              index === 0
                ? "border-yellow-300/40 bg-yellow-400/15"
                : "border-white/10 bg-black/20"
            }`}
          >
            <CharacterAvatar
              character={characters[index % characters.length]}
              size="sm"
              showInfo={false}
              rank={index + 1}
            />

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-white">
                {post.content}
              </div>

              <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-black text-white/55">
                <span>💗 {post.vote_count || post.votes || 0}</span>
                <span>🤖 AI {Math.round(post.ai_score || 0)}</span>
                <span>
                  ⚡ {Math.round(post.viral_score || post.final_score || post.rank_score || 0)}
                </span>
              </div>
            </div>

            <div className="text-2xl font-black text-yellow-200">
              #{index + 1}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
