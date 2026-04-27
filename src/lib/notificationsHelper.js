import { supabase } from "./supabaseClient";

export async function createNotification(payload) {
  const { userId, type = "info", title, body, meta = {} } = payload || {};
  if (!userId || !title) return null;

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    meta,
  });
}
