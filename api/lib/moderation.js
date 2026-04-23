function fallbackModeration(text = "") {
  const lower = text.toLowerCase();
  if (["vihaan", "tapan", "pommi", "huijaan"].some((w) => lower.includes(w))) {
    return { moderation_status: "rejected", moderation_reason: "Kielletty sisältö", quality_score: 0 };
  }
  if (["btc", "crypto", "klik"].some((w) => lower.includes(w))) {
    return { moderation_status: "review", moderation_reason: "Epäilyttävä sisältö", quality_score: 0.2 };
  }
  return { moderation_status: "approved", moderation_reason: "OK", quality_score: Number(Math.min(1, Math.max(0.25, text.length / 250)).toFixed(3)) };
}

export async function moderatePost(text = "") {
  return fallbackModeration(text);
}
