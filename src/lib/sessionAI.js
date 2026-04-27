let sessionPrefs = {
  highNeed: 1,
  quality: 1,
  trending: 1,
};

export function trackSessionEvent(post, type) {
  if (!post) return;

  if (type === "view") {
    if (post.ai_need >= 70) sessionPrefs.highNeed += 0.02;
  }

  if (type === "vote" || type === "boost") {
    if (post.ai_quality >= 70) sessionPrefs.quality += 0.05;
    if (post.learning_boost > 1) sessionPrefs.trending += 0.05;
  }

  sessionPrefs.highNeed = Math.min(1.6, sessionPrefs.highNeed);
  sessionPrefs.quality = Math.min(1.6, sessionPrefs.quality);
  sessionPrefs.trending = Math.min(1.6, sessionPrefs.trending);
}

export function getSessionPrefs() {
  return sessionPrefs;
}

export function calculateSessionBoost(post, prefs) {
  let boost = 1;

  if (post.ai_need >= 70) boost *= prefs.highNeed;
  if (post.ai_quality >= 70) boost *= prefs.quality;
  if (post.learning_boost > 1) boost *= prefs.trending;

  return Math.max(0.8, Math.min(1.8, boost));
}
