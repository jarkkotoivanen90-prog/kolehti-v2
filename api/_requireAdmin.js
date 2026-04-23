import { getProfileFromRequest } from "./_getProfile.js";

export async function requireAdmin(req) {
  const profile = await getProfileFromRequest(req);
  if (!profile?.is_admin) {
    const err = new Error("Admin only");
    err.statusCode = 403;
    throw err;
  }
  return profile;
}
