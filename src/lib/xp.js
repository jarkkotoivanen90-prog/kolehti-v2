import { supabase } from "./supabaseClient";
import { getMyRankWithNeighbors } from "./rank";
import { emitXPEvent } from "./xpEvents";

export async function xpEvent(type, refId = null, amount = 0) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) return null;

    const before = await getMyRankWithNeighbors();

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

    await supabase.rpc("update_streak", {
      p_user: user.id,
    });

    const after = await getMyRankWithNeighbors();

    const payload = {
      type,
      amount,
      refId,

      beforeRank: before?.rank ?? null,
      afterRank: after?.rank ?? null,

      passedUser: before?.above?.user_name ?? null,

      levelBefore: before?.me?.level ?? null,
      levelAfter: after?.me?.level ?? null,

      streak: after?.me?.streak_count ?? 0,

      didRankUp:
        before?.rank &&
        after?.rank &&
        after.rank < before.rank,

      didLevelUp:
        before?.me?.level &&
        after?.me?.level &&
        after.me.level > before.me.level,
    };

    emitXPEvent(payload);

    return payload;
  } catch (err) {
    console.error("xpEvent error:", err);
    return null;
  }
}
