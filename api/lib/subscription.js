export function hasActiveSubscription(profile) {
  if (process.env.STRIPE_ENABLED !== "true") return true;
  if (!profile) return false;
  if (profile.subscription_status === "active") {
    if (!profile.subscription_expires_at) return true;
    return new Date(profile.subscription_expires_at) > new Date();
  }
  return false;
}
