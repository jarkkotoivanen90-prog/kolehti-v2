export function cleanPostContent(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

export function validatePostInput(content) {
  const clean = cleanPostContent(content);

  if (!clean) {
    return { ok: false, content: clean, reason: "Perustelu puuttuu." };
  }

  if (clean.length < 20) {
    return { ok: false, content: clean, reason: "Kirjoita vähintään 20 merkkiä." };
  }

  if (clean.length > 1000) {
    return { ok: false, content: clean.slice(0, 1000), reason: "Teksti on liian pitkä." };
  }

  return { ok: true, content: clean, reason: null };
}

export function normalizePostForInsert({ content, user, groupId, aiResult }) {
  const validation = validatePostInput(content);
  if (!validation.ok) throw new Error(validation.reason);
  if (!user?.id) throw new Error("Kirjaudu ensin sisään.");

  return {
    content: validation.content,
    user_id: user.id,
    group_id: groupId || null,
    ai_score: Number(aiResult?.ai_score || aiResult?.score || 50),
    ai_quality: Number(aiResult?.ai_quality || 50),
    ai_need: Number(aiResult?.ai_need || 50),
    ai_clarity: Number(aiResult?.ai_clarity || 50),
    ai_risk: Number(aiResult?.ai_risk || 0),
    ai_feedback: aiResult || {},
    votes: 0,
    views: 0,
    boost_score: 0,
    is_bot: false,
    paid_day_entry: false,
  };
}

export async function logClientError(supabase, payload) {
  try {
    await supabase.from("client_errors").insert({
      source: payload?.source || "app",
      message: String(payload?.message || "Unknown error").slice(0, 500),
      details: payload?.details || {},
      user_id: payload?.user_id || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("client_errors table missing or blocked:", error);
  }
}
