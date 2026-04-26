export function getRankScore(post) {
  const votes = post.vote_count || 0;
  const ai = Number(post.ai_score || 0);
  const boost = Number(post.boost_score || 0);

  const created = post.created_at ? new Date(post.created_at).getTime() : Date.now();
  const hoursOld = Math.max(1, (Date.now() - created) / 1000 / 60 / 60);
  const freshness = Math.max(0, 80 - hoursOld * 2);

  return votes * 100 + ai * 2 + boost * 60 + freshness;
}

export function nextDrawLabel() {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const diff = end - now;
  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);

  return `${h}h ${m}min`;
}
