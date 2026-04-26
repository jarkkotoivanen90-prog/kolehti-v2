export function getNearWinBoost(post, topScore) {
  if (!topScore) return 0;

  const score = Number(post.rank_score || post.vote_count || 0);
  const ratio = score / topScore;

  if (ratio >= 0.9) return 30;
  if (ratio >= 0.75) return 18;
  if (ratio >= 0.6) return 10;

  return 0;
}

export function getFreshnessScore(createdAt) {
  if (!createdAt) return 0;

  const hoursOld =
    (Date.now() - new Date(createdAt).getTime()) / 1000 / 60 / 60;

  return Math.max(0, 80 - hoursOld * 2);
}

export function rankPosts(posts = []) {
  const enriched = posts.map((post) => {
    const votes = Number(post.vote_count || 0);
    const ai = Number(post.ai_score || 0);
    const boost = Number(post.boost_score || 0);
    const comments = Number(post.comment_count || 0);
    const freshness = getFreshnessScore(post.created_at);

    const baseScore =
      votes * 100 +
      ai * 2 +
      boost * 60 +
      comments * 15 +
      freshness;

    return {
      ...post,
      rank_score: baseScore,
    };
  });

  const topScore = Math.max(...enriched.map((p) => p.rank_score || 0), 0);

  return enriched
    .map((post) => ({
      ...post,
      near_win_boost: getNearWinBoost(post, topScore),
      final_score:
        Number(post.rank_score || 0) + getNearWinBoost(post, topScore),
    }))
    .sort((a, b) => b.final_score - a.final_score);
}

export function nextDrawLabel() {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const diff = Math.max(0, end - now);
  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);

  return `${h}h ${m}min ${s}s`;
}
