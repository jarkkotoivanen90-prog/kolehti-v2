export function validateParticipation({ hasVoted = true, hasActivePost = true, boostCount = 0 } = {}) {
  if (!hasVoted) return { ok: false, reason: 'Sinun tulee äänestää osallistuaksesi' };
  if (!hasActivePost) return { ok: false, reason: 'Sinulla ei ole aktiivista perustelua' };
  if (boostCount > 6) return { ok: false, reason: 'Boost limit ylitetty' };
  return { ok: true };
}
