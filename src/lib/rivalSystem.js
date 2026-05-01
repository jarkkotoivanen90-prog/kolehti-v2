const RIVAL_KEY = "kolehti_rival_v1";

const DEFAULT_RIVAL = {
  rivalId: null,
  encounters: 0,
  winsAgainstRival: 0,
  lossesAgainstRival: 0,
  lastGap: 0,
  lastWeekId: null,
};

export function readRivalState() {
  try {
    const raw = localStorage.getItem(RIVAL_KEY);
    return raw ? { ...DEFAULT_RIVAL, ...JSON.parse(raw) } : { ...DEFAULT_RIVAL };
  } catch {
    return { ...DEFAULT_RIVAL };
  }
}

export function writeRivalState(next) {
  try {
    localStorage.setItem(RIVAL_KEY, JSON.stringify({ ...DEFAULT_RIVAL, ...next, updatedAt: Date.now() }));
  } catch {}
}

export function selectRival({ ranked = [], userId = null } = {}) {
  const state = readRivalState();
  const userIndex = ranked.findIndex((entry) => entry.user_id === userId);
  const userEntry = userIndex >= 0 ? ranked[userIndex] : null;

  const existing = state.rivalId ? ranked.find((entry) => entry.user_id === state.rivalId || entry.id === state.rivalId) : null;
  if (existing && existing.user_id !== userId) return buildRivalSnapshot({ state, userEntry, rival: existing, ranked });

  const above = userIndex > 0 ? ranked[userIndex - 1] : null;
  const below = userIndex >= 0 ? ranked[userIndex + 1] : null;
  const strongestBot = ranked.find((entry) => entry.bot);
  const candidate = above || below || strongestBot || ranked.find((entry) => entry.user_id !== userId);

  if (!candidate) return null;
  const next = { ...state, rivalId: candidate.user_id || candidate.id };
  writeRivalState(next);
  return buildRivalSnapshot({ state: next, userEntry, rival: candidate, ranked });
}

export function buildRivalSnapshot({ state = readRivalState(), userEntry = null, rival = null, ranked = [] } = {}) {
  if (!rival) return null;
  const userScore = Number(userEntry?.winner_score || userEntry?.score || 0);
  const rivalScore = Number(rival?.winner_score || rival?.score || 0);
  const gap = userEntry ? Math.abs(rivalScore - userScore) : rivalScore;
  const userAhead = Boolean(userEntry && userScore >= rivalScore);
  const rivalRank = ranked.findIndex((entry) => (entry.user_id || entry.id) === (rival.user_id || rival.id)) + 1;
  const userRank = userEntry ? ranked.findIndex((entry) => entry.id === userEntry.id) + 1 : null;

  return {
    rival,
    userEntry,
    rivalRank,
    userRank,
    gap,
    userAhead,
    pressure: Math.min(100, 42 + gap / 18 + Number(state.encounters || 0) * 6),
    title: userAhead ? "Rival jahtaa sinua" : "Rival edelläsi",
    message: userAhead
      ? `${getRivalName(rival)} on ${Math.round(gap)} pisteen päässä sinusta.`
      : `${getRivalName(rival)} johtaa sinua ${Math.round(gap)} pisteellä.`,
  };
}

export function recordRivalOutcome({ weekId, userWon = false, gap = 0 } = {}) {
  const state = readRivalState();
  if (state.lastWeekId === weekId) return state;
  const next = {
    ...state,
    encounters: Number(state.encounters || 0) + 1,
    winsAgainstRival: Number(state.winsAgainstRival || 0) + (userWon ? 1 : 0),
    lossesAgainstRival: Number(state.lossesAgainstRival || 0) + (userWon ? 0 : 1),
    lastGap: gap,
    lastWeekId: weekId,
  };
  writeRivalState(next);
  return next;
}

export function getRivalName(entry = {}) {
  if (entry.identity?.alias) return entry.identity.alias;
  if (entry.bot) return entry.bot_name || "Pelibotti";
  return "Pelaaja";
}

export function getRivalStory(snapshot) {
  if (!snapshot?.rival) return "Rivalia ei ole vielä valittu.";
  const state = readRivalState();
  if (state.encounters >= 3 && state.winsAgainstRival > state.lossesAgainstRival) return "Olet saanut tästä rivalista otteen.";
  if (state.encounters >= 3 && state.lossesAgainstRival >= state.winsAgainstRival) return "Tämä rival on ollut sinulle vaikea vastus.";
  if (snapshot.gap <= 80) return "Ero on pieni. Tämä on suora kaksintaistelu.";
  return "Tämä rival määrittää sinun seuraavan tavoitteen.";
}
