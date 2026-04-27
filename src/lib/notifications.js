import { supabase } from "./supabaseClient";

export async function createNotification({ userId, type, title, body, meta = {} }) {
  if (!userId) return;

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    meta,
  });
}

export async function getMyNotifications(userId) {
  if (!userId) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return data || [];
}

export async function markNotificationsRead(userId) {
  if (!userId) return;

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId);
}

async function wasRankingNoticeSent(userId, key) {
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("growth_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", key)
    .gte("created_at", `${today}T00:00:00.000Z`)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

async function markRankingNotice(userId, key, meta = {}) {
  await supabase.from("growth_events").insert({
    user_id: userId,
    event_type: key,
    source: "ranking_notice",
    points: 0,
    meta,
  });
}

export async function notifyRankingMoment({ userId, post, rankInfo }) {
  if (!userId || !post || !rankInfo) return;

  const rank = Number(rankInfo.rank || 0);
  const votesNeeded = Number(rankInfo.votesNeeded || rankInfo.votes_needed || 0);

  if (rank > 0 && rank <= 3) {
    const key = `ranking_top3_${post.id}_${rank}`;
    if (await wasRankingNoticeSent(userId, key)) return;

    await createNotification({
      userId,
      type: "ranking_top3",
      title: "🏆 Postauksesi on kärjessä",
      body: `Postauksesi on nyt sijalla #${rank}.`,
      meta: { post_id: post.id, rank },
    });

    await markRankingNotice(userId, key, { post_id: post.id, rank });
    return;
  }

  if (rank > 3 && rank <= 6 && votesNeeded > 0 && votesNeeded <= 3) {
    const key = `ranking_close_${post.id}_${rank}_${votesNeeded}`;
    if (await wasRankingNoticeSent(userId, key)) return;

    await createNotification({
      userId,
      type: "ranking_close",
      title: "⚡ Lähellä kärkeä",
      body: `${votesNeeded} ääntä voi nostaa postauksesi top-sijoille.`,
      meta: { post_id: post.id, rank, votes_needed: votesNeeded },
    });

    await markRankingNotice(userId, key, { post_id: post.id, rank, votes_needed: votesNeeded });
  }
}
