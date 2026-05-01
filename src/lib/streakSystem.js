const STREAK_KEY = "kolehti_streak_ego_v1";

const DEFAULT_STATE = {
  weeksPlayed: 0,
  currentStreak: 0,
  bestStreak: 0,
  wins: 0,
  losses: 0,
  nearWins: 0,
  lastWeekId: null,
  lastOutcome: null,
  egoXp: 0,
};

export function readStreakState() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function writeStreakState(next) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify({ ...DEFAULT_STATE, ...next, updatedAt: Date.now() }));
  } catch {}
}

export function recordWeeklyOutcome({ weekId, outcome = "loss", nearWin = false, score = 0 } = {}) {
  const state = readStreakState();
  if (state.lastWeekId === weekId && state.lastOutcome === outcome) return state;

  const won = outcome === "win";
  const currentStreak = won ? Number(state.currentStreak || 0) + 1 : 0;
  const egoGain = won ? 80 : nearWin ? 42 : 18;

  const next = {
    ...state,
    weeksPlayed: Number(state.weeksPlayed || 0) + (state.lastWeekId === weekId ? 0 : 1),
    currentStreak,
    bestStreak: Math.max(Number(state.bestStreak || 0), currentStreak),
    wins: Number(state.wins || 0) + (won ? 1 : 0),
    losses: Number(state.losses || 0) + (won ? 0 : 1),
    nearWins: Number(state.nearWins || 0) + (nearWin ? 1 : 0),
    lastWeekId: weekId,
    lastOutcome: outcome,
    lastScore: score,
    egoXp: Math.min(9999, Number(state.egoXp || 0) + egoGain),
  };

  writeStreakState(next);
  return next;
}

export function getEgoLevel(state = readStreakState()) {
  const xp = Number(state.egoXp || 0);
  if (xp >= 1200) return { level: 6, title: "Pottilegenda", tone: "Sinua seurataan jo." };
  if (xp >= 760) return { level: 5, title: "Kärkipaikan uhka", tone: "Yksi hyvä viikko voi riittää." };
  if (xp >= 420) return { level: 4, title: "Nousija", tone: "Momentum alkaa näkyä." };
  if (xp >= 220) return { level: 3, title: "Haastaja", tone: "Et ole enää taustalla." };
  if (xp >= 90) return { level: 2, title: "Mukana pelissä", tone: "Ensimmäinen rytmi löytyy." };
  return { level: 1, title: "Uusi yrittäjä", tone: "Ensimmäinen hyvä entry voi muuttaa kaiken." };
}

export function getEgoMessage(state = readStreakState()) {
  const ego = getEgoLevel(state);
  if (state.currentStreak > 1) return `${state.currentStreak} voiton putki. Nyt pitää puolustaa egoa.`;
  if (state.nearWins > 0 && state.wins === 0) return `Olet ollut lähellä ${state.nearWins} kertaa. Tämä voi olla se viikko.`;
  if (state.losses > state.wins) return "Revanssi on auki. Yksi vahvempi perustelu riittää muuttamaan tarinan.";
  return ego.tone;
}

export function buildEgoSnapshot() {
  const state = readStreakState();
  const ego = getEgoLevel(state);
  return {
    ...state,
    ego,
    message: getEgoMessage(state),
    winRate: state.weeksPlayed ? Math.round((Number(state.wins || 0) / Number(state.weeksPlayed || 1)) * 100) : 0,
  };
}
