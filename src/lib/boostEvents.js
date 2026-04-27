import { supabase } from "./supabaseClient";

export async function getActiveBoostEvent() {
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("boost_events")
    .select("*, posts(*)")
    .eq("active", true)
    .gt("ends_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data || null;
}

export async function createRandomBoostEvent(posts = []) {
  if (!posts.length) return null;

  const existing = await getActiveBoostEvent();
  if (existing) return existing;

  const candidates = posts.filter((post) => !post.is_daily_winner);
  const selected =
    candidates[Math.floor(Math.random() * candidates.length)] || posts[0];

  if (!selected?.id) return null;

  const endsAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from("posts")
    .update({
      boost_event_active: true,
      boost_event_until: endsAt,
      boost_multiplier: 2,
      boost_score: Number(selected.boost_score || 0) + 25,
    })
    .eq("id", selected.id);

  const { data } = await supabase
    .from("boost_events")
    .insert({
      post_id: selected.id,
      title: "⚡ 2x Boost käynnissä",
      multiplier: 2,
      ends_at: endsAt,
      active: true,
    })
    .select("*, posts(*)")
    .single();

  return data || null;
}

export async function cleanupExpiredBoostEvents() {
  const now = new Date().toISOString();

  const { data: expired } = await supabase
    .from("boost_events")
    .select("*")
    .eq("active", true)
    .lte("ends_at", now);

  if (!expired?.length) return;

  await supabase
    .from("boost_events")
    .update({ active: false })
    .eq("active", true)
    .lte("ends_at", now);

  for (const event of expired) {
    if (event.post_id) {
      await supabase
        .from("posts")
        .update({
          boost_event_active: false,
          boost_multiplier: 1,
        })
        .eq("id", event.post_id);
    }
  }
}
