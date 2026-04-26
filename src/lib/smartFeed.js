export function calculateViralScore(post) {
  const ageHours = Math.max(
    1,
    (Date.now() - new Date(post.created_at).getTime()) / 1000 / 60 / 60
  );

  const votes = Number(post.vote_count || post.votes || 0);
  const views = Number(post.view_count || post.views || 0);
  const aiScore = Number(post.ai_score || 50);
  const aiNeed = Number(post.ai_need || 50);
  const aiClarity = Number(post.ai_clarity || 50);
  const boost = Number(post.boost_score || 0);

  const freshness = Math.max(0, 120 - ageHours * 4);
  const engagement = votes * 120 + views * 4;
  const conversion = votes / Math.max(1, views);
  const quality = aiScore * 2 + aiNeed * 1.2 + aiClarity;

  return Math.round(
    quality * 0.45 +
      engagement * 0.35 +
      freshness * 0.12 +
      conversion * 250 +
      boost
  );
}

export function getStatusLabel(post, index = 0) {
  const votes = Number(post.vote_count || post.votes || 0);
  const aiScore = Number(post.ai_score || 0);

  if (index === 0) return "🏆 Kärjessä";
  if (index <= 2) return "🔥 TOP 3";
  if (aiScore >= 85) return "🤖 AI suosikki";
  if (votes >= 10) return "🚀 Nousemassa";
  if (votes >= 3) return "💗 Hyvässä vauhdissa";
  return "✨ Uusi mahdollisuus";
}

export function getSmartFeed(posts = []) {
  const enriched = posts.map((post) => ({
    ...post,
    viral_score: calculateViralScore(post),
  }));

  const top = [...enriched]
    .sort((a, b) => b.viral_score - a.viral_score)
    .slice(0, 12);

  const rising = enriched
    .filter((p) => Number(p.ai_score || 0) >= 60 && Number(p.vote_count || 0) < 5)
    .slice(0, 8);

  const fresh = [...enriched]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

  const exploration = [...enriched].sort(() => Math.random() - 0.5).slice(0, 5);

  const merged = [...top, ...rising, ...fresh, ...exploration];

  const unique = Array.from(new Map(merged.map((p) => [p.id, p])).values());

  return unique
    .sort((a, b) => b.viral_score - a.viral_score)
    .map((post, index) => ({
      ...post,
      status_label: getStatusLabel(post, index),
    }));
}
