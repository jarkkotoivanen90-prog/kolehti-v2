import { calculateLivePot, calculateInteractionXp, rankKolehtiFeed, buildEngineSummary } from "./kolehtiEngine";

export function applyKolehtiEngineToFeed(posts, context = {}) {
  try {
    return rankKolehtiFeed(posts, context);
  } catch (error) {
    console.warn("Kolehti engine feed fallback:", error);
    return Array.isArray(posts) ? posts : [];
  }
}

export function getKolehtiEngineUiState({ posts = [], groupSize = 0, invitedPlayers = 0, strongLikesUsed = 0, postsThisWeek = 0 } = {}) {
  const safePosts = Array.isArray(posts) ? posts : [];
  const activePlayers = groupSize || Math.max(1, safePosts.filter(Boolean).length * 120);
  const summary = buildEngineSummary({
    groupSize: activePlayers,
    invitedPlayers,
    strongLikesUsed,
    postsThisWeek,
  });

  return {
    ...summary,
    livePot: calculateLivePot({ activePlayers, invitedPlayers }),
    likeXp: calculateInteractionXp({ action: "like", strongLikesUsed, groupSize: activePlayers }),
    inviteXp: calculateInteractionXp({ action: "invite", groupSize: activePlayers }),
    postXp: calculateInteractionXp({ action: "post", groupSize: activePlayers }),
  };
}
