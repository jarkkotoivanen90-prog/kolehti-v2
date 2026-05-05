import { supabase } from "./supabaseClient";
import { getMyRankWithNeighbors } from "./rank";
import { emitXPEvent } from "./xpEvents";

export async function xpEvent(type, refId = null, amount = 0) {
  try {
    // 👤 käyttäjä
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return null;

    // 📊 ennen
    const before = await getMyRankWithNeighbors();

    // ➕ XP lisäys
    const { error: xpError } = await supabase.rpc("add_xp_event", {
      p_user: user.id,
      p_type: type,
      p_ref: refId,
      p_amount: amount,
    });

    if (xpError) {
      console.error("add_xp_event failed:", xpError);
      return null;
    }

    // 🔥 streak päivitys
    await supabase.rpc("update_streak", {
      p_user: user.id,
    });

    // 📊 jälkeen
    const after = await getMyRankWithNeighbors();

    // 🧠 payload UI:lle
    const payload = {
      type,
      amount,
      refId,

      beforeRank: before?.rank ?? null,
      afterRank: after?.rank ?? null,

      levelBefore: before?.me?.level ?? null,
      levelAfter: after?.me?.level ?? null,

      streak: after?.me?.streak_count ?? 0,

      // 🔥 extra (tulevia UI-efektejä varten)
      didRankUp:
        before?.rank &&
        after?.rank &&
        after.rank < before.rank,

      didLevelUp:
        before?.me?.level &&
        after?.me?.level &&
        after.me.level > before.me.level,
    };

    // ⚡ event trigger UI:lle
    emitXPEvent(payload);

    return payload;
  } catch (err) {
    console.error("xpEvent error:", err);
    return null;
  }
}
