import { supabase } from "./supabaseClient";

export function getLevelFromXP(xp = 0) {
  if (xp >= 2500) return 10;
  if (xp >= 2000) return 9;
  if (xp >= 1600) return 8;
  if (xp >= 1250) return 7;
  if (xp >= 950) return 6;
  if (xp >= 700) return 5;
  if (xp >= 480) return 4;
  if (xp >= 300) return 3;
  if (xp >= 150) return 2;
  return 1;
}

export function getNextLevelXP(level = 1) {
  const map = {
    1: 150,
    2: 300,
    3: 480,
    4: 700,
    5: 950,
    6: 1250,
    7: 1600,
    8: 2000,
    9: 2500,
    10: 2500,
  };

  return map[level] || 2500;
}

export function getPreviousLevelXP(level = 1) {
  const map = {
    1: 0,
    2: 150,
    3: 300,
    4: 480,
    5: 700,
    6: 950,
    7: 1250,
    8: 1600,
    9: 2000,
    10: 2500,
  };

  return map[level] || 0;
}

export function getXPProgress(xp = 0, level = 1) {
  const prev = getPreviousLevelXP(level);
  const next = getNextLevelXP(level);

  if (level >= 10) return 100;

  return Math.min(100, Math.max(0, ((xp - prev) / (next - prev)) * 100));
}

export async function addXP(userId, amount, reason = "action") {
  if (!userId || !amount) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const newXP = Number(profile.xp || 0) + Number(amount);
  const newLevel = getLevelFromXP(newXP);

  const { data } = await supabase
    .from("profiles")
    .update({
      xp: newXP,
      level: newLevel,
    })
    .eq("id", userId)
    .select("*")
    .single();

  await supabase.from("retention_events").insert({
    user_id: userId,
    event_type: "xp_gain",
    meta: {
      amount,
      reason,
      new_xp: newXP,
      new_level: newLevel,
    },
  });

  return data;
}

export async function rewardVote(userId) {
  if (!userId) return null;

  const profile = await addXP(userId, 5, "vote");

  await supabase.rpc("increment_profile_counter", {
    profile_id: userId,
    field_name: "total_votes_given",
    amount: 1,
  }).catch(() => null);

  return profile;
}

export async function rewardPost(userId) {
  if (!userId) return null;

  const profile = await addXP(userId, 10, "post");

  await supabase.rpc("increment_profile_counter", {
    profile_id: userId,
    field_name: "total_posts_created",
    amount: 1,
  }).catch(() => null);

  return profile;
}

export async function rewardTopRank(userId, rank) {
  if (!userId || !rank) return null;

  if (rank === 1) {
    await addXP(userId, 100, "first_place");

    await supabase.rpc("increment_profile_counter", {
      profile_id: userId,
      field_name: "first_place_count",
      amount: 1,
    }).catch(() => null);
  } else if (rank <= 3) {
    await addXP(userId, 50, "top3");

    await supabase.rpc("increment_profile_counter", {
      profile_id: userId,
      field_name: "top3_count",
      amount: 1,
    }).catch(() => null);
  } else if (rank <= 8) {
    await addXP(userId, 25, "almost_win");
  }
}
