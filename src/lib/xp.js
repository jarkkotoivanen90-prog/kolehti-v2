import { supabase } from "./supabaseClient";
import { getMyRankWithNeighbors } from "./rank";
import { emitXPEvent } from "./xpEvents";

export async function xpEvent(type, refId, amount) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return;

    const before = await getMyRankWithNeighbors();

    await supabase.rpc("add_xp_event", {
      p_user: user.id,
      p_type: type,
      p_ref: refId || null,
      p_amount: amount,
    });

    await supabase.rpc("update_streak", {
      p_user: user.id,
    });

    const after = await getMyRankWithNeighbors();

    const payload = {
      type,
      amount,
      refId,
      beforeRank: before?.rank,
      afterRank: after?.rank,
      levelBefore: before?.me?.level,
      levelAfter: after?.me?.level,
      streak: after?.me?.streak_count || 0,
    };

    // 🔥 tämä tekee systeemistä elävän
    emitXPEvent(payload);

    return payload;
  } catch (err) {
    console.error("xpEvent error:", err);
  }
}
