const PREF_KEY = "kolehti_feed_godmode_v1";
const INTEREST_KEY = "kolehti_interest_engine_v1";
const VECTOR_KEY = "kolehti_ai_feed_vector_v2";

const TOPICS = [
  { id: "money", label: "Raha", words: ["raha", "euro", "potti", "maksu", "tuki", "säästö", "sijoitus", "lasku"] },
  { id: "family", label: "Perhe", words: ["perhe", "lapsi", "äiti", "isä", "koti", "vanhempi", "sisar", "läheinen"] },
  { id: "health", label: "Terveys", words: ["terveys", "sairas", "lääke", "hoito", "mieli", "jaksaminen", "apu", "stressi"] },
  { id: "work", label: "Työ", words: ["työ", "duuni", "opiskelu", "koulu", "projekti", "yritys", "ura", "asiakas"] },
  { id: "community", label: "Yhteisö", words: ["yhteisö", "porukka", "tiimi", "naapuri", "kaupunki", "suomi", "yhdessä", "auttaa"] },
  { id: "emotion", label: "Tunne", words: ["kiitos", "toivo", "pelko", "ilo", "surullinen", "unelma", "tärkeä", "merkitys"] },
  { id: "media", label: "Media", words: ["kuva", "video", "näytä", "katso", "tarina"] },
];

const SEMANTIC_AXES = [
  ["money", "raha", "euro", "potti", "maksu", "säästö", "sijoitus", "lasku", "tulo"],
  ["need", "tarve", "apu", "tuki", "hätä", "vaikea", "selviytyä", "pakko"],
  ["hope", "toivo", "unelma", "tulevaisuus", "mahdollisuus", "kasvu", "onnistua"],
  ["family", "perhe", "lapsi", "äiti", "isä", "koti", "läheinen", "ystävä"],
  ["health", "terveys", "sairas", "hoito", "mieli", "jaksaminen", "kipu", "stressi"],
  ["work", "työ", "duuni", "opiskelu", "koulu", "projekti", "yritys", "ura"],
  ["community", "yhteisö", "porukka", "tiimi", "naapuri", "suomi", "yhdessä"],
  ["emotion", "kiitos", "ilo", "pelko", "surullinen", "tärkeä", "merkitys", "sydän"],
  ["clarity", "koska", "siksi", "tavoite", "suunnitelma", "konkreettinen", "selkeä"],
  ["media", "kuva", "video", "tarina", "näytä", "katso", "visuaalinen"],
];

export function getFeedPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; }
}

export function getInterestProfile() {
  try { return JSON.parse(localStorage.getItem(INTEREST_KEY) || "{}"); } catch { return {}; }
}

export function getVectorProfile() {
  try { return JSON.parse(localStorage.getItem(VECTOR_KEY) || "null") || zeroVector(); } catch { return zeroVector(); }
}

function zeroVector() {
  return Array.from({ length: SEMANTIC_AXES.length }, () => 0);
}

function saveInterestProfile(profile) {
  try { localStorage.setItem(INTEREST_KEY, JSON.stringify(profile)); } catch {}
}

function saveVectorProfile(vector) {
  try { localStorage.setItem(VECTOR_KEY, JSON.stringify(vector.map((v) => Math.round(v * 1000) / 1000))); } catch {}
}

export function detectTopics(post) {
  const text = `${post?.content || ""} ${post?.ai_feedback ? JSON.stringify(post.ai_feedback) : ""}`.toLowerCase();
  const found = [];
  for (const topic of TOPICS) if (topic.words.some((word) => text.includes(word))) found.push(topic.id);
  if (hasMedia(post) && !found.includes("media")) found.push("media");
  return found.length ? found : ["general"];
}

export function topicLabel(topicId) {
  return TOPICS.find((topic) => topic.id === topicId)?.label || "Yleinen";
}

export function semanticVector(post) {
  const text = `${post?.content || ""} ${post?.ai_feedback ? JSON.stringify(post.ai_feedback) : ""}`.toLowerCase();
  const lenBoost = Math.min(1, String(post?.content || "").length / 600);
  return SEMANTIC_AXES.map((axis) => {
    const hits = axis.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
    return Math.min(1, hits / Math.max(2, axis.length / 3) + lenBoost * 0.08);
  });
}

function cosine(a = [], b = []) {
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = Number(a[i] || 0);
    const y = Number(b[i] || 0);
    dot += x * y;
    aa += x * x;
    bb += y * y;
  }
  if (!aa || !bb) return 0;
  return dot / (Math.sqrt(aa) * Math.sqrt(bb));
}

export function saveFeedSignal(post, type) {
  if (!post?.id) return;
  const prefs = getFeedPrefs();
  const item = prefs[post.id] || { views: 0, likes: 0, shares: 0, skips: 0, last: 0 };
  item[type] = Number(item[type] || 0) + 1;
  item.last = Date.now();
  item.topics = detectTopics(post);
  item.vector = semanticVector(post);
  prefs[post.id] = item;

  const profile = getInterestProfile();
  const topicWeight = type === "likes" ? 8 : type === "shares" ? 10 : type === "views" ? 2 : type === "skips" ? -4 : 0;
  for (const topic of item.topics) profile[topic] = Math.max(-20, Math.min(100, Number(profile[topic] || 0) + topicWeight));

  const vector = getVectorProfile();
  const postVector = item.vector;
  const vectorWeight = type === "likes" ? 0.18 : type === "shares" ? 0.24 : type === "views" ? 0.06 : type === "skips" ? -0.12 : 0;
  const nextVector = vector.map((value, i) => Math.max(-1, Math.min(1, Number(value || 0) + Number(postVector[i] || 0) * vectorWeight)));

  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    saveInterestProfile(profile);
    saveVectorProfile(nextVector);
  } catch {}
}

function freshnessBoost(createdAt) {
  const ageHours = Math.max(0, (Date.now() - new Date(createdAt || Date.now()).getTime()) / 36e5);
  return Math.max(0, 35 - ageHours * 1.4);
}

function viralVelocity(post) {
  const ageHours = Math.max(0.25, (Date.now() - new Date(post?.created_at || Date.now()).getTime()) / 36e5);
  const votes = Number(post?.votes || post?.vote_count || 0);
  const views = Number(post?.views || post?.watch_time_total || 0);
  const shares = Number(post?.shares || 0);
  return Math.min(80, (votes * 13 + shares * 18 + views * 0.5) / Math.sqrt(ageHours));
}

function exploreBoost(post) {
  const id = String(post?.id || post?.content || "");
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (hash % 1000) / 1000 * 18;
}

function coldStartBoost(post, prefs = getFeedPrefs()) {
  const seenCount = Object.values(prefs).filter((item) => Number(item?.views || 0) > 0).length;
  if (seenCount > 12) return 0;
  const quality = Number(post?.ai_score || post?.score || 0);
  return Math.max(0, 25 - seenCount * 2) + (quality >= 70 ? 12 : 0) + (hasMedia(post) ? 8 : 0);
}

function hasMedia(post) {
  return Boolean(post?.media_url || post?.image_url || post?.video_url);
}

function interestScore(post, profile = getInterestProfile()) {
  const topics = detectTopics(post);
  return topics.reduce((sum, topic) => sum + Number(profile[topic] || 0), 0) / Math.max(1, topics.length);
}

function aiSimilarityScore(post, vectorProfile = getVectorProfile()) {
  const sim = cosine(semanticVector(post), vectorProfile);
  return sim * 80;
}

export function rankGodFeed(posts = []) {
  const prefs = getFeedPrefs();
  const profile = getInterestProfile();
  const vector = getVectorProfile();
  return [...posts].sort((a, b) => godScore(b, prefs, profile, vector) - godScore(a, prefs, profile, vector));
}

export function godScore(post, prefs = getFeedPrefs(), profile = getInterestProfile(), vector = getVectorProfile()) {
  const pref = prefs[post.id] || {};
  const global = Number(post.boost_score || 0) * 5 + Number(post.ai_score || post.score || 0) + Number(post.votes || 0) * 11 + Number(post.views || 0) * 0.7;
  const personal = Number(pref.likes || 0) * 45 + Number(pref.shares || 0) * 35 - Number(pref.skips || 0) * 20 - (Number(pref.views || 0) > 0 ? 18 : 0);
  const interests = interestScore(post, profile) * 1.7;
  const aiV2 = aiSimilarityScore(post, vector);
  const hardcore = viralVelocity(post) + exploreBoost(post) + coldStartBoost(post, prefs);
  return global + personal + interests + aiV2 + hardcore + freshnessBoost(post.created_at) + (hasMedia(post) ? 9 : 0) + (post.bot ? -8 : 0);
}

export function whyForYou(post) {
  const sim = aiSimilarityScore(post);
  const velocity = viralVelocity(post);
  const topTopic = detectTopics(post)[0];
  const profile = getInterestProfile();
  if (velocity >= 35) return "Nousee nopeasti";
  if (sim >= 28) return "AI uskoo tämän osuvan sinuun";
  if (Number(profile[topTopic] || 0) >= 10) return `${topicLabel(topTopic)} kiinnostaa sinua`;
  if (Number(post?.boost_score || 0) > 0) return "Boostattu";
  if (Number(post?.votes || 0) > 0) return "Ihmiset äänestävät tätä";
  if (Number(post?.ai_score || post?.score || 0) >= 70) return "Hyvä perustelu";
  if (hasMedia(post)) return "Media mukana";
  return "Uusi sinulle";
}

export function getTopInterests(limit = 3) {
  const profile = getInterestProfile();
  return Object.entries(profile).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, limit).map(([id, value]) => ({ id, label: topicLabel(id), value }));
}

export function getAiFeedDebug(post) {
  return {
    topics: detectTopics(post),
    vector: semanticVector(post),
    similarity: Math.round(aiSimilarityScore(post)),
    velocity: Math.round(viralVelocity(post)),
    explore: Math.round(exploreBoost(post)),
    why: whyForYou(post),
  };
}
