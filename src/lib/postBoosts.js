import { supabase } from "./supabaseClient";

const BOOST_COST_XP = 25;
const BOOST_VALUE = 75;

export async function boostPostWithXp({ userId, post }) {
  if (!userId || !post?.id) {
    return { ok: false, message: "Kirjaudu ensin." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,xp")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return { ok: false, message: "Profiilia ei löytynyt." };
  }

  if (Number(profile.xp || 0) < BOOST_COST_XP) {
    return { ok: false, message: `Tarvitset ${BOOST_COST_XP} XP boostiin.` };
  }

  const newXp = Number(profile.xp || 0) - BOOST_COST_XP;
  const newBoost = Number(post.boost_score || 0) + BOOST_VALUE;

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
      boost_event_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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
    points: BOOST_VALUE,
    meta: {
      post_id: post.id,
      xp_cost: BOOST_COST_XP,
      boost_value: BOOST_VALUE,
    },
  });

  return {
    ok: true,
    message: `⚡ Boostattu +${BOOST_VALUE} · -${BOOST_COST_XP} XP`,
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
