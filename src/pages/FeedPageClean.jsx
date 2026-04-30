import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import { mergeWithBots, botTicker } from "../lib/bots";

export default function FeedPageClean() {
  const [posts, setPosts] = useState([]);
  const [ticker, setTicker] = useState("");

  useEffect(() => {
    load();
    const t = setInterval(() => setTicker(botTicker()), 3000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    const { data } = await supabase.from("posts").select("*").limit(50);
    const merged = mergeWithBots(data || []);
    setPosts(merged);
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white">
      {ticker && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 text-xs font-black bg-cyan-500/20 border border-cyan-300/30 rounded-full">
          🤖 {ticker}
        </div>
      )}

      <main className="h-[100dvh] overflow-y-auto">
        {posts.map((p) => (
          <div key={p.id} className="premium-card m-4 p-6">
            <div className="flex items-center justify-between">
              <div className="font-black">
                {p.bot ? `🤖 ${p.bot_name}` : "Pelaaja"}
              </div>
              <div className="text-xs text-cyan-200">{p.score} XP</div>
            </div>

            <div className="mt-2 text-white/80">{p.content}</div>

            <div className="mt-3 text-xs text-white/50">
              ♥ {p.votes} · 👀 {p.watch_time_total} · ↗ {p.shares}
            </div>
          </div>
        ))}
      </main>

      <AppBottomNav />
    </div>
  );
}
