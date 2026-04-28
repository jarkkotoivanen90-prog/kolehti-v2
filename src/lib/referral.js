export function getReferralCode(userId) {
  if (!userId) return "";
  try {
    return btoa(String(userId)).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  } catch {
    return String(userId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  }
}

export function getReferralLink(userId) {
  const code = getReferralCode(userId);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/?ref=${code}`;
}

export function storeReferralFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref) return null;
  localStorage.setItem("kolehti_ref", ref);
  return ref;
}

export function getStoredReferral() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kolehti_ref");
}

export function clearStoredReferral() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("kolehti_ref");
}
