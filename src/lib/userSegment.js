export function hoursSince(date) {
  if (!date) return 999;
  return (Date.now() - new Date(date).getTime()) / 1000 / 60 / 60;
}

export function getUserSegment(profile = {}) {
  const lastSeenHours = hoursSince(profile.last_seen_at);
  const streak = Number(profile.user_streak || 0);
  const referrals = Number(profile.referral_count || 0);
  const growthScore = Number(profile.growth_score || 0);
  const votes = Number(profile.total_votes_given || 0);
  const posts = Number(profile.total_posts_created || 0);

  const score = Math.round(
    streak * 10 + referrals * 20 + growthScore * 0.15 + votes * 3 + posts * 8 - Math.min(120, lastSeenHours * 4)
  );

  if (lastSeenHours > 24) return { segment: "returning", score, lastSeenHours };
  if (score >= 180) return { segment: "high_activity", score, lastSeenHours };
  if (score >= 70) return { segment: "active", score, lastSeenHours };
  return { segment: "casual", score, lastSeenHours };
}
