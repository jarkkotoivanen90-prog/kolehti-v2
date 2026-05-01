import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import AppBottomNav from "../components/AppBottomNav";
import WinnerScreen from "../components/WinnerScreen";
import { haptic } from "../lib/effects";
import { mergeWithBots, botDrama } from "../lib/bots";
import { buildWinnerRace, getWinnerReason, formatTimeLeft } from "../lib/winnerSystem";

const BG = "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200";
const panel = "premium-card rounded-[34px] p-5";
const innerPanel = "rounded-[24px] border border-cyan-100/10 bg-[#030816]/58 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]";

const POTS = [
  { key: "daily", title: "Päiväpotti", icon: "☀️", base: 25, multiplier: 0.24, botMultiplier: 0.18 },
  { key: "weekly", title: "Viikkopotti", icon: "📅", base: 150, multiplier: 0.72, botMultiplier: 0.36 },
  { key: "monthly", title: "Kuukausipotti", icon: "🏆", base: 500, multiplier: 1.55, botMultiplier: 0.72 },
  { key: "final", title: "Finaalipotti", icon: "💎", base: 2000, multiplier: 3.75, botMultiplier: 1.35 },
];

function getVoteCountMap(votes) {
  const map = {};
  (votes || []).forEach((vote) => {
    if (!vote?.post_id) return;
    map[vote.post_id] = (map[vote.post_id] || 0) + Number(vote.value || 1);
  });
  return map;
}

function normalizePost(post, voteMap) {
  if (!post || typeof post !== "object") return null;
  const id = post.id || post.post_id;
  const content = String(post.content || post.text || post.body || "").trim();
  if (!id || !content) return null;
  return {
    ...post,
    id,
    content,
    user_id: post.user_id || "unknown-user",
    votes: Number(voteMap[id] || post.vote_count || post.votes || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
    watch_time_total: Number(post.watch_time_total || 0),
    shares: Number(post.shares || 0),
    bot: Boolean(post.bot),
    bot_name: post.bot_name,
    bot_avatar: post.bot_avatar,
    bot_heat: Number(post.bot_heat || 0),
    near_win: Boolean(post.near_win),
  };
}

function scorePost(post, potKey) {
  const potBoost = potKey === "final" ? 1.35 : potKey === "monthly" ? 1.18 : potKey === "weekly" ? 1.08 : 1;
  const botBoost = post.bot ? 1.08 : 1;
  return Math.round((Number(post.votes || 0) * 12 + Number(post.ai_score || 0) + Number(post.growth_score || 0) * 0.55 + Number(post.boost_score || 0) * 4 + Number(post.watch_time_total || 0) * 2 + Number(post.shares || 0) * 6 + (post.near_win ? 45 : 0)) * potBoost * botBoost);
}

export default function PotsPage() {
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveTick, setLiveTick] = useState(0);
  const [reward, setReward] = useState(null);
  const [winnerData, setWinnerData] = useState(null);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("pots-four-live-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => handleLive("Uusi osallistuminen mukana poteissa", "success"))
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => handleLive("Ääni muutti voittajatilannetta", "heavy"))
      .subscribe();
    const interval = setInterval(() => {
      setLiveTick((v) => (v + 1) % 19);
    }, 3600);
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  function handleLive(text, type) {
    setReward({ id: Date.now(), text });
    setLiveTick((v) => v + 1);
    haptic(type);
    setTimeout(() => setReward(null), 1700);
    load();
  }

  async function load() {
    setLoading(true);
    try {
      const [{ data: postData }, { data: voteData }] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("votes").select("post_id,user_id,value,created_at").limit(3000),
      ]);
      setPosts(postData || []);
      setVotes(voteData || []);
    } catch (error) { console.warn("Pots load failed", error); }
    finally { setLoading(false); }
  }

  const potData = useMemo(() => {
    const voteMap = getVoteCountMap(votes);
    const realNormalized = (posts || []).map((post) => normalizePost(post, voteMap)).filter(Boolean);
    const normalized = mergeWithBots(realNormalized, 16).map((post) => normalizePost(post, voteMap)).filter(Boolean);
    const botPosts = normalized.filter((p) => p.bot);
    const playerCount = Math.max(1, new Set([...normalized.map((p) => p.user_id), ...votes.map((v) => v.user_id).filter(Boolean)]).size);

    return POTS.map((pot, index) => {
      const leaderboard = [...normalized].map((post) => ({ ...post, score: scorePost(post, pot.key) })).sort((a, b) => b.score - a.score).slice(0, 5);
      const amount = Math.round(pot.base + playerCount * pot.multiplier);
      const race = buildWinnerRace(leaderboard, { potKey: pot.key, amount });

      return { ...pot, amount, leaderboard, race };
    });
  }, [posts, votes, liveTick]);

  useEffect(() => {
    potData.forEach((pot) => {
      if (pot.race?.status === "closed" && pot.race.winner) {
        setWinnerData({ winner: pot.race.winner, amount: pot.amount, race: pot.race });
      }
    });
  }, [potData]);

  const total = potData.reduce((sum, pot) => sum + pot.amount, 0);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#050816] text-white">
      <img src={BG} alt="" className="fixed inset-0 h-full w-full object-cover" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/42 via-[#061126]/76 to-black/95" />

      {winnerData && (
        <WinnerScreen
          winner={winnerData.winner}
          amount={winnerData.amount}
          race={winnerData.race}
          onClose={() => setWinnerData(null)}
        />
      )}

      <main className="relative z-10 mx-auto max-w-md px-4 pb-[170px] pt-6">
        <h1 className="text-center text-[56px] font-black">Potit</h1>

        <section className={`${panel} mt-6 text-center`}>
          <div className="text-[64px] font-black">€{total}</div>
        </section>

        <section className="mt-4 space-y-4">
          {potData.map((pot) => (
            <div key={pot.key} className={panel}>
              <div className="text-3xl font-black">€{pot.amount}</div>
            </div>
          ))}
        </section>
      </main>

      <AppBottomNav />
    </div>
  );
}
