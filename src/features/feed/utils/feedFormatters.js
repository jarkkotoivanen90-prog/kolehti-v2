const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2800&q=95",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2800&q=95",
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=2800&q=95",
  "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=2800&q=95",
  "https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=2800&q=95",
];

export function stableIndex(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash % BACKGROUNDS.length;
}

function upgradeImageUrl(url = "") {
  if (!url || !url.includes("images.unsplash.com")) return url;
  const hasWidth = /[?&]w=/.test(url);
  const hasQuality = /[?&]q=/.test(url);
  let next = url;
  if (hasWidth) next = next.replace(/([?&])w=\d+/g, "$1w=2800");
  else next += `${next.includes("?") ? "&" : "?"}w=2800`;
  if (hasQuality) next = next.replace(/([?&])q=\d+/g, "$1q=95");
  else next += "&q=95";
  if (!/[?&]auto=/.test(next)) next += "&auto=format";
  if (!/[?&]fit=/.test(next)) next += "&fit=crop";
  return next;
}

export function getMedia(post) {
  const url = post?.video_url || post?.image_url || post?.media_url || "";
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url) || post?.media_type === "video";
  return {
    url: isVideo ? url : upgradeImageUrl(url || BACKGROUNDS[stableIndex(post?.id || post?.content || "kolehti")]),
    type: isVideo ? "video" : "image",
  };
}

export function getScore(post) {
  return Math.round(post?.support_score || post?.ai_score || post?.backend_score || post?.winner_score || post?.score || 0);
}

export function getVotes(post) {
  return Number(post?.votes || post?.vote_count || 0);
}

export function getViews(post) {
  return Number(post?.views || post?.watch_time_total || 0);
}

export function getShares(post) {
  return Number(post?.shares || post?.share_count || 0);
}

export function getAuthor(post) {
  return post?.bot ? post.bot_name : post?.display_name || post?.username || "Pelaaja";
}

export function getAvatar(post) {
  const author = getAuthor(post);
  return post?.bot ? post.bot_avatar || "🤖" : String(author).slice(0, 1).toUpperCase();
}
