export function createFeedbackState() {
  return {
    lastAt: 0,
    seenCards: {},
    deepReads: 0,
    votes: 0,
    shown: {},
  };
}

export function canShowFeedback(state, { force = false, cooldownMs = 6500 } = {}) {
  const now = Date.now();
  if (!force && now - state.lastAt < cooldownMs) return false;
  state.lastAt = now;
  return true;
}

export function makeFeedback({ type, rankInfo, seenCount, deepReads }) {
  if (type === "vote") return { emoji: "💗", title: "+5 XP", text: "Ääni annettu.", force: true };
  if (type === "invite") return { emoji: "🚀", title: "Kutsu kopioitu", text: "Linkki on valmis jaettavaksi.", force: true };
  if (type === "focus" && seenCount === 3) return { emoji: "🔥", title: "Hyvä kierros", text: "Olet nähnyt päivän nousijat." };
  if (type === "focus" && rankInfo?.rank === 2) return { emoji: "👀", title: "Lähellä kärkeä", text: "Tämä perustelu on TOP-taistelussa." };
  if (type === "deep_read" && deepReads === 2) return { emoji: "🧠", title: "Tarkka lukija", text: "Näytetään sinulle jatkossa laadukkaampia perusteluja." };
  return null;
}
