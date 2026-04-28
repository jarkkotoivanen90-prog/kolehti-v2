import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { calculateLivePot, calculateInteractionXp, rankKolehtiFeed } from "../lib/kolehtiEngine";

function normalizePost(post, voteCount = 0) {
  if (!post || typeof post !== "object") return null;
  const id = post.id || post.post_id;
  const content = String(post.content || post.text || post.body || "").trim();
  if (!id || !content) return null;
  return {
    ...post,
    id,
    content,
    user_id: post.user_id || "unknown-user",
    group_id: post.group_id || null,
    created_at: post.created_at || new Date().toISOString(),
    votes: Number(post.votes || post.vote_count || voteCount || 0),
    vote_count: Number(post.vote_count || post.votes || voteCount || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
    views: Number(post.views || 1),
  };
}

function sanitizePosts(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((post) => normalizePost(post, post?.vote_count || post?.votes || 0))
    .filter(Boolean)
    .filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
}

const starterPosts = [
  normalizePost({ id: "starter-1", content: "Kirjoita oma perustelu ja kerää ääniä.", user_id: "starter", vote_count: 5, ai_score: 70, is_starter: true }),
].filter(Boolean);

export default function FeedPageStable() {
  const scrollerRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const safePosts = useMemo(() => sanitizePosts(posts), [posts]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    function onScroll() {
      const index = Math.round(root.scrollTop / root.clientHeight);
      setActiveIndex(index);
    }

    root.addEventListener("scroll", onScroll);
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-black text-white">
      <main ref={scrollerRef} className="h-screen snap-y snap-mandatory overflow-y-scroll">
        {safePosts.map((post, index) => (
          <section key={post.id} className="h-screen snap-start flex items-center justify-center">
            <div className="text-3xl">{post.content}</div>
          </section>
        ))}
      </main>
    </div>
  );
}
