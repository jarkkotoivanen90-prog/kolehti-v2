/* MONEY + HYPE VERSION */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const POT_VALUES = {
  daily: 25,
  weekly: 150,
  monthly: 500,
  group: 2000,
};

export default function PotsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("posts").select("*").limit(200);

    const top = (list) => [...list].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];

    setStats({
      daily: top(data),
      weekly: top(data),
      monthly: top(data),
    });
  }

  if (!stats) return <div className="text-white p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#050816] text-white p-6 space-y-5">
      <h1 className="text-4xl font-black">💰 Potit</h1>

      <Pot title="Päiväpotti" value={POT_VALUES.daily} post={stats.daily} />
      <Pot title="Viikkopotti" value={POT_VALUES.weekly} post={stats.weekly} />
      <Pot title="Kuukausipotti" value={POT_VALUES.monthly} post={stats.monthly} />
    </div>
  );
}

function Pot({ title, value, post }) {
  return (
    <div className="bg-white/10 p-5 rounded-3xl border border-white/10">
      <div className="text-sm text-white/50">{title}</div>
      <div className="text-3xl font-black text-yellow-300">€{value}</div>

      {post && (
        <div className="mt-3 text-sm text-white/70">
          🔥 {post.content}
          <div className="mt-2">💗 {post.votes}</div>
        </div>
      )}
    </div>
  );
}
