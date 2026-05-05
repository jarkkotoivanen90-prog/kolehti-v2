export async function getMyTarget() {
  // ⚡ fake target (toimii heti ilman backendiä)
  return {
    title: "Ensimmäinen nousu",
    diff: Math.floor(Math.random() * 80) + 10, // 10–90 XP
  };
}
