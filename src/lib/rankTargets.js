import { getMyRankWithNeighbors } from "./rank";

export async function getMyTarget() {
  const data = await getMyRankWithNeighbors();

  if (!data?.me || !data?.above) return null;

  const diff = Math.max(
    0,
    Number(data.above.xp || 0) - Number(data.me.xp || 0)
  );

  return {
    targetName: data.above.user_name || "Pelaaja",
    targetXp: Number(data.above.xp || 0),
    myXp: Number(data.me.xp || 0),
    diff,
    rank: data.rank,
  };
}
