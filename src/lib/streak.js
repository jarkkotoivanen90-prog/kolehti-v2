export async function ensureProfile(user, supabase) {
  if (!user?.id) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (data) return data;

  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      user_streak: 0,
      last_active: null,
    })
    .select("*")
    .single();

  return created;
}

export async function updateStreak(user, supabase) {
  if (!user?.id) return null;

  const profile = await ensureProfile(user, supabase);
  if (!profile) return null;

  const today = new Date().toISOString().slice(0, 10);

  if (profile.last_active === today) {
    return profile;
  }

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);

  const continued = profile.last_active === yesterday;

  const newStreak = continued ? Number(profile.user_streak || 0) + 1 : 1;

  const { data } = await supabase
    .from("profiles")
    .update({
      user_streak: newStreak,
      last_active: today,
    })
    .eq("id", user.id)
    .select("*")
    .single();

  return data;
}
