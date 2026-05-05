export function getAIGoal({ text = "", xp = 0, streak = 0 } = {}) {
  const clean = String(text || "").trim();

  if (clean.length < 80) {
    return {
      title: "Kirjoita vahvempi perustelu",
      reward: 10,
      message: "Lisää vähintään yksi konkreettinen syy ja tunne.",
    };
  }

  if (!/[.!?]/.test(clean)) {
    return {
      title: "Selkeytä rakenne",
      reward: 8,
      message: "Lisää piste tai kysymysmerkki, jotta teksti tuntuu valmiilta.",
    };
  }

  if (streak < 3) {
    return {
      title: "Kasvata streakiä",
      reward: 12,
      message: "Palaa huomenna ja pidä putki käynnissä.",
    };
  }

  if (xp < 500) {
    return {
      title: "Nouse rankingissa",
      reward: 15,
      message: "Tykkää, jaa tai julkaise uusi perustelu kerätäksesi XP:tä.",
    };
  }

  return {
    title: "Pidä johtoasema",
    reward: 20,
    message: "Olet hyvässä vauhdissa. Boostaa tai julkaise vahva tarina.",
  };
}
