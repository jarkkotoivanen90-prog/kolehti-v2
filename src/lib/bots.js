export const GAME_BOTS = [
  { id: "bot-aino", name: "Aino", avatar: "A", style: "strategi" },
  { id: "bot-veeti", name: "Veeti", avatar: "V", style: "nopea" },
  { id: "bot-sisu", name: "Sisu", avatar: "S", style: "kilpailija" },
  { id: "bot-lumi", name: "Lumi", avatar: "L", style: "tsemppaaja" },
  { id: "bot-kaapo", name: "Kaapo", avatar: "K", style: "haastaja" },
];

const BOT_TEXTS = [
  "Tämän kierroksen paras perustelu voittaa, ei kovin ääni.",
  "Jos tämä osuu top 5:een, porukan XP nousee kunnolla.",
  "Potti elää nyt nopeasti — yksi hyvä postaus voi muuttaa kaiken.",
  "Tämä on juuri sellainen kierros missä altavastaaja voi nousta kärkeen.",
  "Leaderboard näyttää rauhalliselta, mutta ero topiin on oikeasti pieni.",
  "Äänet ratkaisevat tänään enemmän kuin koskaan.",
  "Jos haluat nousta, nyt on oikea hetki julkaista perustelu.",
  "Finaalipaikat alkavat näyttää kiinnostavilta.",
];

export function makeBotPosts(count = 8) {
  const now = Date.now();
  return Array.from({ length: count }).map((_, index) => {
    const bot = GAME_BOTS[index % GAME_BOTS.length];
    const seed = index + 1;
    return {
      id: `bot-post-${seed}`,
      user_id: bot.id,
      bot: true,
      bot_name: bot.name,
      bot_avatar: bot.avatar,
      content: BOT_TEXTS[index % BOT_TEXTS.length],
      created_at: new Date(now - seed * 1000 * 60 * 9).toISOString(),
      votes: 8 + seed * 3,
      ai_score: 48 + seed * 5,
      growth_score: 50 + seed * 4,
      boost_score: seed % 3,
      watch_time_total: 12 + seed * 2,
      shares: seed % 4,
      score: 0,
    };
  });
}

export function botScore(post) {
  return Math.round(
    Number(post.votes || 0) * 12 +
    Number(post.ai_score || 50) +
    Number(post.boost_score || 0) * 2 +
    Number(post.watch_time_total || 0) * 2 +
    Number(post.shares || 0) * 4
  );
}

export function mergeWithBots(realPosts = [], minCount = 8) {
  const bots = makeBotPosts(minCount);
  const normalizedReal = (realPosts || []).map((post, index) => ({
    ...post,
    bot: false,
    votes: Number(post.votes || post.vote_count || 0),
    ai_score: Number(post.ai_score || post.growth_score || 50),
    growth_score: Number(post.growth_score || post.ai_score || 50),
    boost_score: Number(post.boost_score || 0),
    watch_time_total: Number(post.watch_time_total || 0),
    shares: Number(post.shares || 0),
    score: botScore(post) + 20 + index,
  }));

  const normalizedBots = bots.map((post) => ({ ...post, score: botScore(post) }));
  return [...normalizedReal, ...normalizedBots].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

export function botTicker() {
  const bot = GAME_BOTS[Math.floor(Date.now() / 4000) % GAME_BOTS.length];
  const actions = [
    `${bot.name} nosti yhden perustelun kärjen tuntumaan`,
    `${bot.name} antoi bot-äänen kierrokselle`,
    `${bot.name} seuraa pottia livenä`,
    `${bot.name} haastaa leaderboardia`,
  ];
  return actions[Math.floor(Date.now() / 6000) % actions.length];
}
