import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function VotePage() {
  const [posts, setPosts] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    setPosts(data || []);
  }

  async function vote(post, value) {
    await supabase.from("votes").insert({
      post_id: post.id,
      value,
    });

    setIndex((i) => i + 1);
  }

  const post = posts[index];
  if (!post) return <div className="text-white p-6">Ei lisää</div>;

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white">
      <div className="bg-white/10 p-6 rounded-2xl w-[90%]">
        <h2 className="text-xl font-bold">{post.title}</h2>

        <div className="flex gap-6 mt-6 justify-center">
          <button
            onClick={() => vote(post, -1)}
            className="text-red-400 text-3xl"
          >
            ❌
          </button>

          <button
            onClick={() => vote(post, 1)}
            className="text-green-400 text-3xl"
          >
            ❤️
          </button>
        </div>
      </div>
    </div>
  );
}
