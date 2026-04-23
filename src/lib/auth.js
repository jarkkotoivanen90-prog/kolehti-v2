import { supabase } from "./supabaseClient";

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function ensureProfile(user) {
  if (!user) return null;

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const emailName =
    user.email?.split("@")?.[0]?.slice(0, 24) || `user-${user.id.slice(0, 8)}`;

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: emailName,
      city: "",
      avatar_url: "",
      reputation_score: 0.5,
      trust_level: "new",
      invite_code: user.id.slice(0, 6).toUpperCase(),
      invite_count: 0,
      invite_score: 0,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return inserted;
}
