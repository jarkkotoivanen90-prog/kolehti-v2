import { supabase } from "./supabaseClient";

export const BOOST_LEVELS = [
  { id: "small", label: "Pieni boost", cost: 25, value: 75, minutes: 30 },
  { id: "medium", label: "Iso push", cost: 60, value: 180, minutes: 45 },
  { id: "max", label: "Viral push", cost: 120, value: 400, minutes: 60 },
];

function getBoostLevel(levelId = "small") {
  return BOOST_LEVELS.find((level) => level.id === levelId) || BOOST_LEVELS[0];
}

export async function boostPostWithXp({ userId, post, levelId = "small" }) {
  if (!userId || !post?.id) {
    return { ok: false, message: "Kirjaudu ensin." };
  }

  const level = getBoostLevel(levelId);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,xp")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { ok: false, message: "Profiilia ei löytynyt." };
  }

  if (Number(profile.xp || 0) < level.cost) {
    return { ok: false, message: `Tarvitset ${level.cost} XP boostiin.` };
  }

  const newXp = Number(profile.xp || 0) - level.cost;
  const newBoost = Number(post.boost_score || 0) + level.value;

  const { error: xpError } = await supabase
    .from("profiles")
    .update({ xp: newXp })
    .eq("id", userId);

  if (xpError) {
    return { ok: false, message: xpError.message };
  }

  const { error: postError } = await supabase
    .from("posts")
    .update({
      boost_score: newBoost,
      boost_event_active: true,
      boost_event_until: new Date(Date.now() + level.minutes * 60 * 1000).toISOString(),
      last_engaged_at: new Date().toISOString(),
    })
    .eq("id", post.id);

  if (postError) {
    return { ok: false, message: postError.message };
  }

  await supabase.from("growth_events").insert({
    user_id: userId,
    event_type: "post_boost_xp",
    source: "feed_boost_button",
    points: level.value,
    meta: {
      post_id: post.id,
      level: level.id,
      xp_cost: level.cost,
      boost_value: level.value,
      minutes: level.minutes,
    },
  });

  return {
    ok: true,
    message: `⚡ ${level.label} +${level.value} · -${level.cost} XP`,
    boost_score: newBoost,
    xp: newXp,
  };
}

export function getWinHint(rankInfo) {
  if (!rankInfo) return null;

  const rank = Number(rankInfo.rank || 0);
  const votesNeeded = Number(rankInfo.votesNeeded || rankInfo.votes_needed || 0);

  if (rank === 1) return "👑 Johdat nyt kilpailua";
  if (rank > 1 && rank <= 3) return `🏆 Top ${rank} - pysy kärjessä`;
  if (rank > 3 && rank <= 6 && votesNeeded > 0) return `⚡ ${votesNeeded} ääntä top-sijoille`;
  if (votesNeeded > 0 && votesNeeded <= 5) return `🚀 Lähellä nousua: ${votesNeeded} ääntä`;

  return null;
}

export function getSocialProof(post = {}) {
  const votes = Number(post.vote_count || post.votes || 0);
  const views = Number(post.view_count || post.views || 0);
  const base = votes > 0 ? votes : Math.min(7, Math.max(1, Math.floor(views / 3)));

  if (base >= 10) return `🔥 ${base} käyttäjää äänesti tätä`;
  if (base >= 5) return `👀 Tämä kiinnostaa jo ${base} käyttäjää`;
  if (views >= 10) return `👀 ${views} katselua tänään`;
  return "✨ Ole ensimmäisten joukossa vaikuttamassa";
}
