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

async function ensureProfile(userId) {
  if (!userId) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      xp: 0,
      level: 1,
      total_votes_given: 0,
      total_posts_created: 0,
      top3_count: 0,
      first_place_count: 0,
      user_streak: 0,
      comeback_count: 0,
      retention_score: 0,
    })
    .select("*")
    .single();

  if (error) {
    console.error("ensureProfile error:", error);
    return null;
  }

  return created;
}

export async function addXP(userId, amount, reason = "action") {
  if (!userId || !amount) return null;

  const profile = await ensureProfile(userId);
  if (!profile) return null;

  const newXP = Number(profile.xp || 0) + Number(amount);
  const newLevel = getLevelFromXP(newXP);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      xp: newXP,
      level: newLevel,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("addXP error:", error);
    return null;
  }

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

  const profile = await ensureProfile(userId);
  if (!profile) return null;

  const newXP = Number(profile.xp || 0) + 5;
  const newLevel = getLevelFromXP(newXP);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      xp: newXP,
      level: newLevel,
      total_votes_given: Number(profile.total_votes_given || 0) + 1,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("rewardVote error:", error);
    return null;
  }

  return data;
}

export async function rewardPost(userId) {
  if (!userId) return null;

  const profile = await ensureProfile(userId);
  if (!profile) return null;

  const newXP = Number(profile.xp || 0) + 10;
  const newLevel = getLevelFromXP(newXP);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      xp: newXP,
      level: newLevel,
      total_posts_created: Number(profile.total_posts_created || 0) + 1,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("rewardPost error:", error);
    return null;
  }

  return data;
}

export async function rewardTopRank(userId, rank) {
  if (!userId || !rank) return null;

  const profile = await ensureProfile(userId);
  if (!profile) return null;

  let xpGain = 0;
  let top3Add = 0;
  let firstAdd = 0;

  if (rank === 1) {
    xpGain = 100;
    firstAdd = 1;
  } else if (rank <= 3) {
    xpGain = 50;
    top3Add = 1;
  } else if (rank <= 8) {
    xpGain = 25;
  }

  if (!xpGain) return profile;

  const newXP = Number(profile.xp || 0) + xpGain;
  const newLevel = getLevelFromXP(newXP);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      xp: newXP,
      level: newLevel,
      top3_count: Number(profile.top3_count || 0) + top3Add,
      first_place_count: Number(profile.first_place_count || 0) + firstAdd,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("rewardTopRank error:", error);
    return null;
  }

  return data;
}
