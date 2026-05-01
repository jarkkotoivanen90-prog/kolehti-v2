const IDENTITY_KEY = "kolehti_identity_v1";

const BOT_TITLES = {
  "bot-aino": "Strategi",
  "bot-veeti": "Nopea haastaja",
  "bot-sisu": "Kova kilpailija",
  "bot-lumi": "Porukan nostaja",
  "bot-kaapo": "Piikikäs haastaja",
  "bot-myrsky": "Riskipelaaja",
  "bot-nova": "Nousija",
  "bot-kide": "Data-pelaaja",
};

const PLAYER_TITLES = [
  { min: 2600, title: "Pottilegenda", badge: "👑" },
  { min: 1900, title: "Kärkipaikan uhka", badge: "💎" },
  { min: 1300, title: "Top 5 -jahtaaja", badge: "⚡" },
  { min: 760, title: "Nousija", badge: "🚀" },
  { min: 360, title: "Haastaja", badge: "🔥" },
  { min: 0, title: "Uusi kilpailija", badge: "✨" },
];

export function readIdentityMemory() {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    return raw ? JSON.parse(raw) : { players: {}, lastSeen: {} };
  } catch {
    return { players: {}, lastSeen: {} };
  }
}

export function writeIdentityMemory(next) {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify({ players: {}, lastSeen: {}, ...next, updatedAt: Date.now() }));
  } catch {}
}

function shortId(id = "") {
  return String(id || "pelaaja").replace(/-/g, "").slice(0, 5).toUpperCase();
}

export function getPlayerAlias(entry = {}) {
  if (entry.bot) return entry.bot_name || "Pelibotti";
  if (entry.display_name) return entry.display_name;
  if (entry.username) return entry.username;
  if (entry.profile_name) return entry.profile_name;
  return `Pelaaja ${shortId(entry.user_id)}`;
}

export function getIdentityForEntry(entry = {}, index = 0) {
  const memory = readIdentityMemory();
  const score = Number(entry.winner_score || entry.score || 0);
  const userId = entry.user_id || entry.id || `unknown-${index}`;
  const existing = memory.players?.[userId] || {};

  if (entry.bot) {
    return {
      id: userId,
      alias: getPlayerAlias(entry),
      title: BOT_TITLES[userId] || entry.bot_style || "Pelibotti",
      badge: entry.bot_rival ? "😈" : "🤖",
      reputation: Math.min(100, Math.round(42 + score / 42 + Number(entry.bot_heat || 0) / 3)),
      isBot: true,
      isLegend: false,
      subtitle: entry.bot_rival ? "Rival-botti" : "Pelibotti",
    };
  }

  const tier = PLAYER_TITLES.find((item) => score >= item.min) || PLAYER_TITLES[PLAYER_TITLES.length - 1];
  const wins = Number(existing.wins || 0);
  const top3 = Number(existing.top3 || 0);
  const reputation = Math.min(100, Math.round(score / 38 + wins * 12 + top3 * 5));

  return {
    id: userId,
    alias: existing.alias || getPlayerAlias(entry),
    title: existing.title || tier.title,
    badge: existing.badge || tier.badge,
    reputation,
    isBot: false,
    isLegend: score >= 2600 || wins >= 3,
    subtitle: wins > 0 ? `${wins} voittoa` : top3 > 0 ? `${top3} top 3 -sijoitusta` : "Kilpailija",
  };
}

export function decorateLeaderboard(entries = []) {
  return entries.map((entry, index) => ({
    ...entry,
    identity: getIdentityForEntry(entry, index),
    rankLabel: index === 0 ? "Johtaja" : index === 1 ? "Haastaja" : index === 2 ? "Top 3" : `Sija #${index + 1}`,
  }));
}

export function recordIdentityResult({ winner, top3 = [] } = {}) {
  const memory = readIdentityMemory();
  const players = { ...(memory.players || {}) };

  top3.forEach((entry) => {
    if (!entry?.user_id || entry.bot) return;
    const current = players[entry.user_id] || {};
    players[entry.user_id] = {
      ...current,
      alias: current.alias || getPlayerAlias(entry),
      top3: Number(current.top3 || 0) + 1,
      bestScore: Math.max(Number(current.bestScore || 0), Number(entry.winner_score || entry.score || 0)),
      lastSeenAt: Date.now(),
    };
  });

  if (winner?.user_id && !winner.bot) {
    const current = players[winner.user_id] || {};
    players[winner.user_id] = {
      ...current,
      alias: current.alias || getPlayerAlias(winner),
      wins: Number(current.wins || 0) + 1,
      bestScore: Math.max(Number(current.bestScore || 0), Number(winner.winner_score || winner.score || 0)),
      title: Number(current.wins || 0) + 1 >= 3 ? "Pottilegenda" : current.title,
      badge: Number(current.wins || 0) + 1 >= 3 ? "👑" : current.badge,
      lastWinAt: Date.now(),
    };
  }

  writeIdentityMemory({ ...memory, players });
}

export function getIdentityStory(entry = {}) {
  const identity = entry.identity || getIdentityForEntry(entry);
  if (identity.isLegend) return `${identity.alias} on jo legenda tässä leaderboardissa.`;
  if (identity.reputation >= 80) return `${identity.alias} on yksi tämän kierroksen pelätyimmistä nimistä.`;
  if (identity.reputation >= 55) return `${identity.alias} rakentaa mainettaan nopeasti.`;
  return `${identity.alias} hakee läpimurtoa.`;
}
