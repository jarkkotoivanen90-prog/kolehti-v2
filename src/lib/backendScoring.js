const SCORE_CACHE_TTL = 12_000;
let scoreCache = { key: "", at: 0, scores: {} };

function getFunctionBaseUrl() {
  const explicit = import.meta.env?.VITE_SUPABASE_FUNCTIONS_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
  if (!supabaseUrl) return "";
  return supabaseUrl.replace(".supabase.co", ".functions.supabase.co").replace(/\/$/, "");
}

export async function fetchBackendScores(posts = []) {
  const ids = (posts || []).map((post) => post?.id).filter(Boolean).slice(0, 300);
  if (!ids.length) return {};

  const key = ids.join("|");
  if (scoreCache.key === key && Date.now() - scoreCache.at < SCORE_CACHE_TTL) {
    return scoreCache.scores;
  }

  const baseUrl = getFunctionBaseUrl();
  if (!baseUrl) return {};

  try {
    const response = await fetch(`${baseUrl}/calculate-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postIds: ids }),
    });

    if (!response.ok) throw new Error(`Backend score failed: ${response.status}`);
    const data = await response.json();
    const scores = {};
    (data?.scores || []).forEach((item) => {
      if (!item?.post_id) return;
      scores[item.post_id] = {
        score: Number(item.score || 0),
        votes: Number(item.votes || 0),
        calculated_at: item.calculated_at,
      };
    });

    scoreCache = { key, at: Date.now(), scores };
    return scores;
  } catch (error) {
    console.warn("Backend scoring unavailable, using frontend fallback", error);
    return {};
  }
}

export function applyBackendScores(posts = [], backendScores = {}) {
  return (posts || []).map((post) => {
    const backend = backendScores?.[post.id];
    if (!backend) return post;
    return {
      ...post,
      score: backend.score,
      winner_score: backend.score,
      votes: backend.votes,
      vote_count: backend.votes,
      backend_scored: true,
      backend_scored_at: backend.calculated_at,
    };
  });
}
