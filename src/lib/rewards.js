import { supabase } from "./supabaseClient";
import { addXP, getLevelFromXP } from "./progression";

export async function claimDailyReward(userId) {
  if (!userId) return null;

  const today = new Date().toISOString().slice(0, 10);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  if (profile.daily_reward_claimed_at === today) {
    return {
      claimed: false,
      profile,
      message: "Päivän palkinto on jo haettu.",
    };
  }

  const xpAmount = 20;
  const rewardPoints = Number(profile.reward_points || 0) + 1;

  const updatedProfile = await addXP(userId, xpAmount, "daily_reward");

  await supabase
    .from("profiles")
    .update({
      daily_reward_claimed_at: today,
      reward_points: rewardPoints,
    })
    .eq("id", userId);

  await supabase.from("reward_events").insert({
    user_id: userId,
    type: "daily_reward",
    amount: xpAmount,
    title: "Päivän palkinto",
    meta: {
      xp: xpAmount,
      reward_points: rewardPoints,
    },
  });

  return {
    claimed: true,
    profile: updatedProfile,
    xp: xpAmount,
    message: `+${xpAmount} XP päivän palkinnosta`,
  };
}

export async function checkLevelUp(userId) {
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const currentLevel = Number(profile.level || getLevelFromXP(profile.xp || 0));
  const lastSeen = Number(profile.last_level_seen || 1);

  if (currentLevel > lastSeen) {
    await supabase
      .from("profiles")
      .update({
        last_level_seen: currentLevel,
      })
      .eq("id", userId);

    await supabase.from("reward_events").insert({
      user_id: userId,
      type: "level_up",
      amount: currentLevel,
      title: `Nousit tasolle ${currentLevel}`,
      meta: {
        level: currentLevel,
      },
    });

    return {
      levelUp: true,
      level: currentLevel,
      title: `LEVEL ${currentLevel}`,
      message: "Uusi taso avattu!",
    };
  }

  return {
    levelUp: false,
    level: currentLevel,
  };
}
