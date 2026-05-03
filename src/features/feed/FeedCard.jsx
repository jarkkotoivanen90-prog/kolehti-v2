import { motion } from "framer-motion";
import { getMedia, getScore, getVotes, getShares, getAuthor, getAvatar } from "./utils/feedFormatters";

export default function FeedCard({ post, active, index, liked, shared, onLike, onShare }) {
  const media = getMedia(post);
  const author = getAuthor(post);
  const avatar = getAvatar(post);
  const likes = getVotes(post) + (liked ? 1 : 0);
  const shares = getShares(post) + (shared ? 1 : 0);
  const ai = getScore(post);

  return (
    <section className="relative h-[100dvh] snap-start overflow-hidden">
      {media.type === "video" ? (
        <video src={media.url} className="absolute inset-0 h-full w-full object-cover" autoPlay={active} muted loop />
      ) : (
        <img src={media.url} className="absolute inset-0 h-full w-full object-cover" />
      )}

      <div className="absolute bottom-[120px] left-0 right-0 px-4">
        <div className="rounded-3xl border border-white/20 bg-transparent p-4">
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span>🧠 {ai}%</span>
            <span>❤️ {likes}</span>
            <span>↗ {shares}</span>
          </div>

          <div className="text-lg font-bold mb-2">{author}</div>

          <div className="text-3xl font-black leading-tight">
            {post.content}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={onLike}>äänestä</button>
            <button onClick={onShare}>jaa</button>
          </div>
        </div>
      </div>
    </section>
  );
}
