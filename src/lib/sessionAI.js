let sessionPrefs = {
  highNeed: 1,
  quality: 1,
  trending: 1,
  deepView: 1,
};

export function trackSessionEvent(post, type) {
  if (!post) return;

  if (type === "view") {
    if (post.ai_need >= 70) sessionPrefs.highNeed += 0.02;
  }

  if (type === "deep_view") {
    sessionPrefs.deepView += 0.08;
    if (post.ai_need >= 70) sessionPrefs.highNeed += 0.05;
    if (post.ai_quality >= 70) sessionPrefs.quality += 0.04;
    if (post.learning_boost > 1) sessionPrefs.trending += 0.04;
  }

  if (type === "vote" || type === "boost") {
    if (post.ai_quality >= 70) sessionPrefs.quality += 0.05;
    if (post.learning_boost > 1) sessionPrefs.trending += 0.05;
  }

  if (type === "share") {
    sessionPrefs.trending += 0.04;
  }

  sessionPrefs.highNeed = Math.min(1.7, sessionPrefs.highNeed);
  sessionPrefs.quality = Math.min(1.7, sessionPrefs.quality);
  sessionPrefs.trending = Math.min(1.7, sessionPrefs.trending);
  sessionPrefs.deepView = Math.min(1.6, sessionPrefs.deepView);
}

export function getSessionPrefs() {
  return sessionPrefs;
}

export function calculateSessionBoost(post, prefs) {
  let boost = 1;

  if (post.ai_need >= 70) boost *= prefs.highNeed;
  if (post.ai_quality >= 70) boost *= prefs.quality;
  if (post.learning_boost > 1) boost *= prefs.trending;
  if ((post.view_count || post.views || 0) > 0) boost *= prefs.deepView;

  return Math.max(0.8, Math.min(1.9, boost));
}
