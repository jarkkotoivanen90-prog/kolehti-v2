import { supabase } from "./supabaseClient";
import { createNotification } from "./notifications";

export async function trackViralEvent(userId, eventType, meta = {}) {
  await supabase.from("growth_events").insert({
    user_id: userId || null,
    event_type: eventType,
    source: meta.source || "viral_loop_v3",
    points: Number(meta.points || 0),
    meta,
  });
}

async function alreadySent(userId, eventType) {
  const { data } = await supabase
    .from("growth_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
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
  if (await alreadySent(userId, rewardKey)) return null;

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
  if (await alreadySent(userId, eventKey)) return null;

  await trackViralEvent(userId, eventKey, {
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
  if (await alreadySent(userId, eventKey)) return null;

  await trackViralEvent(userId, eventKey, { hours_away: hoursAway });

  await createNotification({
    userId,
    type: "comeback",
    title: "👋 Ranking on muuttunut",
    body: "Käy katsomassa mitä porukassa tapahtui ja nappaa comeback-pisteet.",
  });

  return { hoursAway };
}

export async function notifyPostMomentum(posts = [], currentUserId) {
  if (!currentUserId || !posts.length) return null;

  const myPosts = posts.filter((post) => post.user_id === currentUserId);
  if (!myPosts.length) return null;

  const best = [...myPosts].sort((a, b) => {
    const scoreA = Number(a.vote_count || a.votes || 0) * 100 + Number(a.ai_score || 0) + Number(a.boost_score || 0);
    const scoreB = Number(b.vote_count || b.votes || 0) * 100 + Number(b.ai_score || 0) + Number(b.boost_score || 0);
    return scoreB - scoreA;
  })[0];

  const rank = posts.findIndex((post) => post.id === best.id) + 1;
  if (!rank || rank > 5) return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const eventKey = `post_momentum_${todayKey}_${best.id}_${rank}`;
  if (await alreadySent(currentUserId, eventKey)) return null;

  await trackViralEvent(currentUserId, eventKey, {
    post_id: best.id,
    rank,
    votes: Number(best.vote_count || best.votes || 0),
  });

  await createNotification({
    userId: currentUserId,
    type: "post_momentum",
    title: rank === 1 ? "👑 Olet kärjessä" : `🚀 Postauksesi on TOP ${rank}`,
    body: rank === 1
      ? "Pidä johto. Yksi lisä-ääni voi ratkaista päivän kierroksen."
      : "Postauksesi on nousussa. Jaa kutsu tai pyydä porukkaa äänestämään.",
  });

  return { post: best, rank };
}

export async function notifyCloseToTop(posts = [], currentUserId) {
  if (!currentUserId || posts.length < 2) return null;

  const sorted = [...posts].sort((a, b) => {
    const scoreA = Number(a.vote_count || a.votes || 0) * 100 + Number(a.ai_score || 0) + Number(a.boost_score || 0);
    const scoreB = Number(b.vote_count || b.votes || 0) * 100 + Number(b.ai_score || 0) + Number(b.boost_score || 0);
    return scoreB - scoreA;
  });

  const myPost = sorted.find((post) => post.user_id === currentUserId);
  if (!myPost) return null;

  const myRank = sorted.findIndex((post) => post.id === myPost.id) + 1;
  if (myRank !== 2 && myRank !== 3) return null;

  const topPost = sorted[0];
  const myVotes = Number(myPost.vote_count || myPost.votes || 0);
  const topVotes = Number(topPost.vote_count || topPost.votes || 0);
  const diff = Math.max(1, topVotes - myVotes + 1);

  if (diff > 3) return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const eventKey = `close_to_top_${todayKey}_${myPost.id}`;
  if (await alreadySent(currentUserId, eventKey)) return null;

  await trackViralEvent(currentUserId, eventKey, {
    post_id: myPost.id,
    rank: myRank,
    votes_needed: diff,
  });

  await createNotification({
    userId: currentUserId,
    type: "almost_win",
    title: "⚡ Olet lähellä kärkeä",
    body: `${diff} ääntä voi nostaa postauksesi kärkeen.`,
  });

  return { post: myPost, rank: myRank, votesNeeded: diff };
}

export async function trackGroupMomentum(posts = [], currentUserId, groupId) {
  if (!currentUserId || !groupId || !posts.length) return null;

  const activePosts = posts.filter((post) => post.group_id === groupId);
  const hotCount = activePosts.filter((post) => Number(post.vote_count || post.votes || 0) >= 3).length;

  if (hotCount < 3) return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const eventKey = `group_momentum_${todayKey}_${groupId}`;
  if (await alreadySent(currentUserId, eventKey)) return null;

  await trackViralEvent(currentUserId, eventKey, {
    group_id: groupId,
    hot_count: hotCount,
  });

  await createNotification({
    userId: currentUserId,
    type: "group_momentum",
    title: "🔥 Porukassa tapahtuu nyt",
    body: `${hotCount} postausta on nousussa. Nyt on hyvä hetki äänestää.`,
  });

  return { hotCount };
}

export async function runViralLoopV2(userId, profile) {
  if (!userId) return;

  await rewardInviteStreak(userId, profile?.referral_count || 0);
  await notifyIfSomeonePassedMe(userId);
  await triggerComebackPrompt(userId);
}

export async function runViralLoopV3({ userId, profile, posts = [], groupId = null }) {
  if (!userId) return;

  await runViralLoopV2(userId, profile);
  await notifyPostMomentum(posts, userId);
  await notifyCloseToTop(posts, userId);
  await trackGroupMomentum(posts, userId, groupId);
}
