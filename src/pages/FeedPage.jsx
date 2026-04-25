import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();

    const channel = supabase
      .channel("live")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, init)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, init)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function init() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    const groupId = localStorage.getItem("kolehti_group_id");

    if (groupId) {
      const { data } = await supabase.from("groups").select("*").eq("id", groupId).single();
      setGroup(data);
    }

    let postsQuery = supabase.from("posts").select("*");
    let votesQuery = supabase.from("votes").select("*");

    if (groupId) {
      postsQuery = postsQuery.eq("group_id", groupId);
      votesQuery = votesQuery.eq("group_id", groupId);
    }

    const { data: postsData } = await postsQuery;
    const { data: votesData } = await votesQuery;

    const ranked = rank(postsData || [], votesData || []);

    setPosts(ranked);
    setVotes(votesData || []);
    setLoading(false);
  }

  function rank(posts, votes) {
    const counts = {};

    votes.forEach(v => {
      counts[v.post_id] = (counts[v.post_id] || 0) + 1;
    });

    return posts
      .map(p => ({
        ...p,
        vote_count: counts[p.id] || 0
      }))
      .sort((a, b) => score(b) - score(a));
  }

  function score(post) {
    const age = (Date.now() - new Date(post.created_at)) / 3600000;
    return post.vote_count - age * 0.1;
  }

  function hasVoted(postId) {
    return votes.some(v => v.post_id === postId && v.user_id === user?.id);
  }

  async function vote(post) {
    if (!user) return alert("Kirjaudu");

    if (hasVoted(post.id)) return;

    const groupId = localStorage.getItem("kolehti_group_id");

    await supabase.from("votes").insert({
      user_id: user.id,
      post_id: post.id,
      group_id: groupId
    });

    init();
  }

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black">Feed</h1>
          <p>{group ? group.name : "Valitse porukka"}</p>
        </div>

        <div className="flex gap-2">
          <Link to="/new" className="bg-cyan-500 px-4 py-2 rounded">Uusi</Link>
          <Link to="/groups" className="border px-4 py-2 rounded">Porukat</Link>
        </div>
      </div>

      {posts.map((p, i) => (
        <div key={p.id} className="mb-4 p-4 bg-white/10 rounded">
          <div>{i + 1}</div>
          <p>{p.content}</p>

          <button onClick={() => vote(p)} disabled={hasVoted(p.id)}>
            ❤️ {p.vote_count}
          </button>
        </div>
      ))}
    </div>
  );
}
