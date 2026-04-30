export const GAME_BOTS = [
  { id: "bot-aino", name: "Aino", avatar: "A", style: "strategi", aggression: 1.16 },
  { id: "bot-veeti", name: "Veeti", avatar: "V", style: "nopea", aggression: 1.28 },
  { id: "bot-sisu", name: "Sisu", avatar: "S", style: "kilpailija", aggression: 1.42 },
  { id: "bot-lumi", name: "Lumi", avatar: "L", style: "tsemppaaja", aggression: 1.08 },
  { id: "bot-kaapo", name: "Kaapo", avatar: "K", style: "haastaja", aggression: 1.34 },
  { id: "bot-myrsky", name: "Myrsky", avatar: "M", style: "riskipelaaja", aggression: 1.58 },
  { id: "bot-nova", name: "Nova", avatar: "N", style: "nousija", aggression: 1.48 },
  { id: "bot-kide", name: "Kide", avatar: "K", style: "tarkka", aggression: 1.22 },
];

const BOT_TEXTS = [
  "Kärki ei ole turvassa. Yksi hyvä perustelu voi viedä koko kierroksen.",
  "Nostan tätä nyt, koska top 5 näyttää liian hiljaiselta.",
  "Jos tämä saa vielä muutaman äänen, leaderboard menee uusiksi.",
  "Potti alkaa lämmetä. Nyt kannattaa pelata eikä katsella sivusta.",
  "Altavastaajalla on selvästi momentum päällä.",
  "Tässä on finaalipaikan tuntua — pieni ero, iso paine.",
  "Kärki johtaa vain näennäisesti. Ero on oikeasti pieni.",
  "Nyt on sellainen hetki missä porukka voi nousta kerralla.",
  "Tämä perustelu ansaitsee boostin ennen kuin kierros sulkeutuu.",
  "Jos jäät odottamaan, joku muu ottaa paikan topissa.",
  "Leaderboard ei pysy näin kauaa. Kohta joku ohittaa.",
  "Tämä on near win -tilanne. Yksi ääni voi muuttaa kaiken.",
];

export function makeBotPosts(count = 16) {
  const now = Date.now();
  const pulse = Math.floor(now / 5000) % 9;
  return Array.from({ length: count }).map((_, index) => {
    const bot = GAME_BOTS[index % GAME_BOTS.length];
    const seed = index + 1;
    const nearWinBoost = index % 4 === pulse % 4 ? 18 : 0;
    const aggression = bot.aggression || 1;
    return {
      id: `bot-post-${seed}`,
      user_id: bot.id,
      bot: true,
      bot_name: bot.name,
      bot_avatar: bot.avatar,
      bot_style: bot.style,
      content: BOT_TEXTS[index % BOT_TEXTS.length],
      created_at: new Date(now - seed * 1000 * 60 * 4).toISOString(),
      votes: Math.round((18 + seed * 5 + nearWinBoost) * aggression),
      ai_score: Math.round((58 + seed * 4 + nearWinBoost) * Math.min(1.18, aggression)),
      growth_score: Math.round((55 + seed * 5) * Math.min(1.2, aggression)),
      boost_score: Math.round((seed % 5) + nearWinBoost / 8),
      watch_time_total: Math.round((24 + seed * 4 + pulse) * aggression),
      shares: Math.round((seed % 6) + nearWinBoost / 12),
      score: 0,
      bot_heat: Math.min(100, 42 + seed * 5 + nearWinBoost),
      near_win: nearWinBoost > 0,
    };
  });
}

export function botScore(post) {
  return Math.round(
    Number(post.votes || 0) * 12 +
    Number(post.ai_score || 50) +
    Number(post.growth_score || 50) * 0.55 +
    Number(post.boost_score || 0) * 4 +
    Number(post.watch_time_total || 0) * 2 +
    Number(post.shares || 0) * 6 +
    Number(post.near_win ? 45 : 0)
  );
}

export function mergeWithBots(realPosts = [], minCount = 16) {
  const bots = makeBotPosts(minCount);
  const normalizedReal = (realPosts || []).map((post, index) => ({
    ...post,
    bot: false,
    bot_name: "Pelaaja",
    votes: Number(post.votes || post.vote_count || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
    watch_time_total: Number(post.watch_time_total || 0),
    shares: Number(post.shares || 0),
    bot_heat: 28 + index * 3,
    score: botScore(post) + 35 + index,
  }));

  const normalizedBots = bots.map((post) => ({ ...post, score: botScore(post) }));
  return [...normalizedReal, ...normalizedBots].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

export function botTicker() {
  const bot = GAME_BOTS[Math.floor(Date.now() / 2200) % GAME_BOTS.length];
  const actions = [
    `${bot.name} boostasi near-win perustelua`,
    `${bot.name} nosti bottihaastajan top 3 -taisteluun`,
    `${bot.name} painaa leaderboardia kovempaan vauhtiin`,
    `${bot.name} lisäsi painetta kärkeen`,
    `${bot.name} haastaa pottijohtajan`,
    `${bot.name} loi uuden ohituspaikan`,
    `${bot.name} aktivoi bot-kierroksen`,
    `${bot.name} nosti XP-lämmön yli 80%`,
  ];
  return actions[Math.floor(Date.now() / 2800) % actions.length];
}

export function botDrama(posts = []) {
  const botPosts = posts.filter((p) => p.bot);
  const hot = botPosts.find((p) => p.near_win) || botPosts[0];
  if (!hot) return null;
  return {
    title: "BOT PRESSURE",
    text: `${hot.bot_name} on lähellä ohitusta · ${hot.score} XP`,
    heat: hot.bot_heat || 70,
  };
}
