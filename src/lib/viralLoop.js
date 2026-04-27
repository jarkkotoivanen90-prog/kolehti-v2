import { supabase } from "./supabaseClient";
import { createNotification } from "./notifications";

export async function trackViralEvent(userId, eventType, meta = {}) {
  await supabase.from("growth_events").insert({
    user_id: userId || null,
    event_type: eventType,
    source: "viral_loop_v2",
    points: Number(meta.points || 0),
    meta,
  });
}

export async function rewardInviteStreak(userId, referralCount = 0) {
  if (!userId) return null;

  const count = Number(referralCount || 0);
  let bonus = 0;
  let title = "";

  if (count >= 10) {
    bonus = 500;
    title = "🚀 10 kutsua täynnä";
  } else if (count >= 5) {
    bonus = 250;
    title = "🔥 5 kutsua täynnä";
  } else if (count >= 3) {
    bonus = 100;
    title = "⚡ 3 kutsua täynnä";
  }

  if (!bonus) return null;

  const rewardKey = `invite_bonus_${count >= 10 ? 10 : count >= 5 ? 5 : 3}`;

  const { data: existing } = await supabase
    .from("growth_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", rewardKey)
    .limit(1)
    .maybeSingle();

  if (existing) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp,growth_score")
    .eq("id", userId)
    .maybeSingle();

  await supabase
    .from("profiles")
    .update({
      xp: Number(profile?.xp || 0) + bonus,
      growth_score: Number(profile?.growth_score || 0) + bonus,
    })
    .eq("id", userId);

  await trackViralEvent(userId, rewardKey, { points: bonus, referral_count: count });

  await createNotification({
    userId,
    type: "growth_bonus",
    title,
    body: `Sait +${bonus} XP growth-bonuksen.`,
  });

  return { bonus, rewardKey };
}

export async function notifyIfSomeonePassedMe(userId) {
  if (!userId) return null;

  const { data: leaderboard } = await supabase
    .from("profiles")
    .select("id,display_name,username,growth_score")
    .order("growth_score", { ascending: false })
    .limit(10);

  if (!leaderboard?.length) return null;

  const myIndex = leaderboard.findIndex((p) => p.id === userId);
  if (myIndex <= 0) return null;

  const personAbove = leaderboard[myIndex - 1];
  const me = leaderboard[myIndex];

  const difference = Number(personAbove.growth_score || 0) - Number(me.growth_score || 0);
  if (difference <= 0 || difference > 150) return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const eventKey = `passed_alert_${todayKey}_${personAbove.id}`;

  const { data: existing } = await supabase
    .from("growth_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", eventKey)
    .limit(1)
    .maybeSingle();

  if (existing) return null;

  await trackViralEvent(userId, eventKey, {
    points: 0,
    person_above: personAbove.id,
    difference,
  });

  await createNotification({
    userId,
    type: "leaderboard_alert",
    title: "🔥 Joku nousi edellesi",
    body: `${personAbove.display_name || personAbove.username || "Käyttäjä"} on vain ${difference} pisteen päässä. Yksi kutsu voi nostaa sinut ohi.`,
  });

  return { personAbove, difference };
}

export async function triggerComebackPrompt(userId) {
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_seen_at, comeback_count")
    .eq("id", userId)
    .maybeSingle();

  const lastSeen = profile?.last_seen_at ? new Date(profile.last_seen_at).getTime() : 0;
  const hoursAway = lastSeen ? (Date.now() - lastSeen) / 1000 / 60 / 60 : 0;

  if (hoursAway < 12) return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const eventKey = `comeback_prompt_${todayKey}`;

  const { data: existing } = await supabase
    .from("growth_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", eventKey)
    .limit(1)
    .maybeSingle();

  if (existing) return null;

  await trackViralEvent(userId, eventKey, { hours_away: hoursAway });

  await createNotification({
    userId,
    type: "comeback",
    title: "👋 Ranking on muuttunut",
    body: "Käy katsomassa mitä porukassa tapahtui ja nappaa comeback-pisteet.",
  });

  return { hoursAway };
}

export async function runViralLoopV2(userId, profile) {
  if (!userId) return;

  await rewardInviteStreak(userId, profile?.referral_count || 0);
  await notifyIfSomeonePassedMe(userId);
  await triggerComebackPrompt(userId);
}
