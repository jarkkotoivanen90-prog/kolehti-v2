import { supabase } from "../_supabaseAdmin.js";

export async function getConfig(key, fallback = null) {
  const { data, error } = await supabase.from("app_config").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return data?.value ?? fallback;
}

export async function setConfig(key, value) {
  const { error } = await supabase.from("app_config").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}
