import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function getMedia(post) {
  const url = post?.video_url || post?.image_url || "";
  const isVideo = /\.(mp4|webm|mov)/i.test(url);
  return { url, isVideo };
}

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.rpc("match_ai_feed_v3", { match_count: 50 });
    setPosts(data || []);
  }

  return (
    <div className="bg-black text-white">
      {posts.map((post) => {
        const media = getMedia(post);
        return (
          <div key={post.id} className="relative h-[100dvh] w-full overflow-hidden flex items-end">
            {media.url && (
              media.isVideo ? (
                <video src={media.url} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <img src={media.url} className="absolute inset-0 h-full w-full object-cover" />
              )
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="relative p-5 pb-24 max-w-[90%]">
              <p className="text-2xl font-bold leading-tight">{post.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
