import { supabase } from "./supabaseClient";

export async function createNotification({ userId, type, title, body }) {
  if (!userId) return;

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
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
