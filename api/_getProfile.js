import { supabase } from "./_supabaseAdmin.js";

export async function getProfileFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token) throw new Error("Missing auth token");

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new Error("Invalid user");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error("Profile not found");
  return profile;
}
