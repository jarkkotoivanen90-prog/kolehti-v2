export async function runShadowModeration(post) {
  if (process.env.SHADOW_MODERATION_ENABLED !== "true") return { shadow_status: "visible", shadow_reason: "Feature disabled" };
  const body = String(post?.body || "").toLowerCase();
  if (/https?:\/\/|www\./.test(body)) return { shadow_status: "limited", shadow_reason: "Linkkipainotteinen sisältö" };
  if (/(.)\1\1\1/.test(body)) return { shadow_status: "limited", shadow_reason: "Toistuva roskasisältö" };
  if (body.length < 20) return { shadow_status: "limited", shadow_reason: "Liian lyhyt sisältö" };
  return { shadow_status: "visible", shadow_reason: "OK" };
}
