const PREF_KEY = "kolehti_feed_godmode_v1";

export function getFeedPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveFeedSignal(post, type) {
  if (!post?.id) return;
  const prefs = getFeedPrefs();
  const item = prefs[post.id] || { views: 0, likes: 0, shares: 0, skips: 0, last: 0 };
  item[type] = Number(item[type] || 0) + 1;
  item.last = Date.now();
  prefs[post.id] = item;
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {}
}

function freshnessBoost(createdAt) {
  const ageHours = Math.max(0, (Date.now() - new Date(createdAt || Date.now()).getTime()) / 36e5);
  return Math.max(0, 35 - ageHours * 1.4);
}

function hasMedia(post) {
  return Boolean(post?.media_url || post?.image_url || post?.video_url);
}

export function rankGodFeed(posts = []) {
  const prefs = getFeedPrefs();
  return [...posts].sort((a, b) => godScore(b, prefs) - godScore(a, prefs));
}

export function godScore(post, prefs = getFeedPrefs()) {
  const pref = prefs[post.id] || {};
  const global =
    Number(post.boost_score || 0) * 5 +
    Number(post.ai_score || post.score || 0) +
    Number(post.votes || 0) * 11 +
    Number(post.views || 0) * 0.7;

  const personal =
    Number(pref.likes || 0) * 45 +
    Number(pref.shares || 0) * 35 -
    Number(pref.skips || 0) * 20 -
    (Number(pref.views || 0) > 0 ? 18 : 0);

  return global + personal + freshnessBoost(post.created_at) + (hasMedia(post) ? 9 : 0) + (post.bot ? -8 : 0);
}

export function whyForYou(post) {
  if (Number(post?.boost_score || 0) > 0) return "Boostattu";
  if (Number(post?.votes || 0) > 0) return "Ihmiset äänestävät tätä";
  if (Number(post?.ai_score || post?.score || 0) >= 70) return "Hyvä perustelu";
  if (hasMedia(post)) return "Media mukana";
  return "Uusi sinulle";
}
