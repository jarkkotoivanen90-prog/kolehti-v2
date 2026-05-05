// src/lib/xp.js

import { supabase } from "./supabaseClient";
import { getMyRankWithNeighbors } from "./rank";
import { emitXPEvent } from "./xpEvents";

export async function xpEvent(type, refId = null, amount = 0) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) {
      // 🔥 fallback: UI silti reagoi
      emitXPEvent({ type, amount });
      return;
    }

    let before = null;
    let after = null;

    try {
      before = await getMyRankWithNeighbors();
    } catch {}

    // 🔥 EI blokata UI:ta vaikka backend failaa
    const { error } = await supabase.rpc("add_xp_event", {
      p_user: user.id,
      p_type: type,
      p_ref: refId,
      p_amount: amount,
    });

    if (error) {
      console.warn("XP RPC failed, but UI continues", error);
    }

    try {
      await supabase.rpc("update_streak", {
        p_user: user.id,
      });
    } catch {}

    try {
      after = await getMyRankWithNeighbors();
    } catch {}

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

    // 🔥 TÄMÄ ON KRIITTINEN
    emitXPEvent(payload);

    return payload;

  } catch (err) {
    console.error("xpEvent crash:", err);

    // 🔥 fallback UI trigger
    emitXPEvent({ type, amount });

    return null;
  }
}
