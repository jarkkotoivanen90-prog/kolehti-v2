import CharacterAvatar from "./CharacterAvatar";
import { characters } from "../data/characters";

export default function TopThree({ posts = [] }) {
  const top = posts.slice(0, 3);

  if (top.length === 0) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 text-white/70">
        Ei vielä TOP 3 -listaa.
      </div>
    );
  }

  return (
    <div className="rounded-[30px] border border-yellow-300/30 bg-yellow-500/10 p-5 shadow-2xl">
      <h2 className="text-xl font-black text-yellow-200">🏆 Live TOP 3</h2>

      <div className="mt-4 space-y-3">
        {top.map((post, index) => (
          <div
            key={post.id}
            className="flex items-center gap-3 rounded-2xl bg-black/20 p-3"
          >
            <CharacterAvatar
              character={characters[index % characters.length]}
              size="sm"
              showInfo={false}
              rank={index + 1}
            />

            <div className="min-w-0 flex-1">
              <div className="truncate font-black text-white">
                {post.content}
              </div>
              <div className="text-xs font-bold text-white/55">
                💗 {post.vote_count || 0} ääntä · Score{" "}
                {Math.round(post.final_score || post.rank_score || 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
