import { supabase } from "./supabaseClient";
import { getMyRankWithNeighbors } from "./rank";

/**
 * XP event handler
 * - lisää XP
 * - päivittää streakin
 * - palauttaa tilanne ennen/jälkeen (optional käyttöön UI:ssa)
 */
export async function xpEvent(type, refId, amount) {
  try {
    // 🔐 käyttäjä
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) return null;

    // 📊 ennen
    const before = await getMyRankWithNeighbors();

    // ➕ lisää XP
    await supabase.rpc("add_xp_event", {
      p_user: user.id,
      p_type: type,
      p_ref: refId || null,
      p_amount: amount,
    });

    // 🔥 streak update
    await supabase.rpc("update_streak", {
      p_user: user.id,
    });

    // 📊 jälkeen
    const after = await getMyRankWithNeighbors();

    // 🎯 palautetaan data UI:lle (jos haluat käyttää)
    return {
      type,
      amount,
      refId,
      beforeRank: before?.rank,
      afterRank: after?.rank,
      passedUser: before?.above?.user_name,
      levelBefore: before?.me?.level,
      levelAfter: after?.me?.level,
      streak: after?.me?.streak_count || 0,
    };
  } catch (err) {
    console.error("xpEvent error:", err);
    return null;
  }
}
