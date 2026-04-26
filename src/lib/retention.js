import { supabase } from "./supabaseClient";

export async function trackRetentionEvent(userId, eventType, meta = {}) {
  if (!eventType) return;

  await supabase.from("retention_events").insert({
    user_id: userId || null,
    event_type: eventType,
    meta,
  });
}

export async function updateLastSeen(userId) {
  if (!userId) return null;

  const now = new Date().toISOString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,last_seen_at,comeback_count,retention_score")
    .eq("id", userId)
    .single();

  const lastSeen = profile?.last_seen_at
    ? new Date(profile.last_seen_at).getTime()
    : 0;

  const hoursAway = lastSeen ? (Date.now() - lastSeen) / 1000 / 60 / 60 : 0;
  const comeback = hoursAway >= 12 ? 1 : 0;

  const newScore =
    Number(profile?.retention_score || 0) +
    1 +
    (comeback ? 5 : 0);

  const { data } = await supabase
    .from("profiles")
    .update({
      last_seen_at: now,
      comeback_count: Number(profile?.comeback_count || 0) + comeback,
      retention_score: newScore,
    })
    .eq("id", userId)
    .select("*")
    .single();

  await trackRetentionEvent(userId, comeback ? "comeback" : "seen", {
    hoursAway,
  });

  return data;
}

export function getComebackMessage(profile) {
  const count = Number(profile?.comeback_count || 0);

  if (count >= 10) return "🔥 Olet palannut jo monta kertaa. Nyt mennään kärkeen.";
  if (count >= 3) return "⚡ Hyvä paluu. Ranking on muuttunut.";
  return "👋 Tervetuloa takaisin. Katso mikä on noussut.";
}
