const PREF_KEY = "kolehti_feed_godmode_v1";
const INTEREST_KEY = "kolehti_interest_engine_v1";

const TOPICS = [
  { id: "money", label: "Raha", words: ["raha", "euro", "potti", "maksu", "tuki", "säästö", "sijoitus", "lasku"] },
  { id: "family", label: "Perhe", words: ["perhe", "lapsi", "äiti", "isä", "koti", "vanhempi", "sisar", "läheinen"] },
  { id: "health", label: "Terveys", words: ["terveys", "sairas", "lääke", "hoito", "mieli", "jaksaminen", "apu", "stressi"] },
  { id: "work", label: "Työ", words: ["työ", "duuni", "opiskelu", "koulu", "projekti", "yritys", "ura", "asiakas"] },
  { id: "community", label: "Yhteisö", words: ["yhteisö", "porukka", "tiimi", "naapuri", "kaupunki", "suomi", "yhdessä", "auttaa"] },
  { id: "emotion", label: "Tunne", words: ["kiitos", "toivo", "pelko", "ilo", "surullinen", "unelma", "tärkeä", "merkitys"] },
  { id: "media", label: "Media", words: ["kuva", "video", "näytä", "katso", "tarina"] },
];

export function getFeedPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getInterestProfile() {
  try {
    return JSON.parse(localStorage.getItem(INTEREST_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveInterestProfile(profile) {
  try {
    localStorage.setItem(INTEREST_KEY, JSON.stringify(profile));
  } catch {}
}

export function detectTopics(post) {
  const text = `${post?.content || ""} ${post?.ai_feedback ? JSON.stringify(post.ai_feedback) : ""}`.toLowerCase();
  const found = [];
  for (const topic of TOPICS) {
    if (topic.words.some((word) => text.includes(word))) found.push(topic.id);
  }
  if (hasMedia(post) && !found.includes("media")) found.push("media");
  return found.length ? found : ["general"];
}

export function topicLabel(topicId) {
  return TOPICS.find((topic) => topic.id === topicId)?.label || "Yleinen";
}

export function saveFeedSignal(post, type) {
  if (!post?.id) return;
  const prefs = getFeedPrefs();
  const item = prefs[post.id] || { views: 0, likes: 0, shares: 0, skips: 0, last: 0 };
  item[type] = Number(item[type] || 0) + 1;
  item.last = Date.now();
  item.topics = detectTopics(post);
  prefs[post.id] = item;

  const profile = getInterestProfile();
  const weight = type === "likes" ? 8 : type === "shares" ? 10 : type === "views" ? 2 : type === "skips" ? -4 : 0;
  for (const topic of item.topics) {
    profile[topic] = Math.max(-20, Math.min(100, Number(profile[topic] || 0) + weight));
  }

  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    saveInterestProfile(profile);
  } catch {}
}

function freshnessBoost(createdAt) {
  const ageHours = Math.max(0, (Date.now() - new Date(createdAt || Date.now()).getTime()) / 36e5);
  return Math.max(0, 35 - ageHours * 1.4);
}

function hasMedia(post) {
  return Boolean(post?.media_url || post?.image_url || post?.video_url);
}

function interestScore(post, profile = getInterestProfile()) {
  const topics = detectTopics(post);
  return topics.reduce((sum, topic) => sum + Number(profile[topic] || 0), 0) / Math.max(1, topics.length);
}

export function rankGodFeed(posts = []) {
  const prefs = getFeedPrefs();
  const profile = getInterestProfile();
  return [...posts].sort((a, b) => godScore(b, prefs, profile) - godScore(a, prefs, profile));
}

export function godScore(post, prefs = getFeedPrefs(), profile = getInterestProfile()) {
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

  const interests = interestScore(post, profile) * 1.7;

  return global + personal + interests + freshnessBoost(post.created_at) + (hasMedia(post) ? 9 : 0) + (post.bot ? -8 : 0);
}

export function whyForYou(post) {
  const topTopic = detectTopics(post)[0];
  const profile = getInterestProfile();
  if (Number(profile[topTopic] || 0) >= 10) return `${topicLabel(topTopic)} kiinnostaa sinua`;
  if (Number(post?.boost_score || 0) > 0) return "Boostattu";
  if (Number(post?.votes || 0) > 0) return "Ihmiset äänestävät tätä";
  if (Number(post?.ai_score || post?.score || 0) >= 70) return "Hyvä perustelu";
  if (hasMedia(post)) return "Media mukana";
  return "Uusi sinulle";
}

export function getTopInterests(limit = 3) {
  const profile = getInterestProfile();
  return Object.entries(profile)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, limit)
    .map(([id, value]) => ({ id, label: topicLabel(id), value }));
}
