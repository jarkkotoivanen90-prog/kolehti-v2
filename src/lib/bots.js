export const GAME_BOTS = [
  { id: "bot-aino", name: "Aino", avatar: "A", style: "strategi", aggression: 1.16, mood: "rauhallinen", typoRate: .08, favorite: "potti", rhythm: 1.05 },
  { id: "bot-veeti", name: "Veeti", avatar: "V", style: "nopea", aggression: 1.28, mood: "malttamaton", typoRate: .16, favorite: "feed", rhythm: .72 },
  { id: "bot-sisu", name: "Sisu", avatar: "S", style: "kilpailija", aggression: 1.42, mood: "suora", typoRate: .06, favorite: "leaderboard", rhythm: .9 },
  { id: "bot-lumi", name: "Lumi", avatar: "L", style: "tsemppaaja", aggression: 1.08, mood: "pehmeä", typoRate: .04, favorite: "porukka", rhythm: 1.35 },
  { id: "bot-kaapo", name: "Kaapo", avatar: "K", style: "haastaja", aggression: 1.34, mood: "piikikäs", typoRate: .14, favorite: "ohitus", rhythm: .82 },
  { id: "bot-myrsky", name: "Myrsky", avatar: "M", style: "riskipelaaja", aggression: 1.58, mood: "aggressiivinen", typoRate: .12, favorite: "hyökkäys", rhythm: .66 },
  { id: "bot-nova", name: "Nova", avatar: "N", style: "nousija", aggression: 1.48, mood: "itsevarma", typoRate: .07, favorite: "nousu", rhythm: .78 },
  { id: "bot-kide", name: "Kide", avatar: "K", style: "tarkka", aggression: 1.22, mood: "analyyttinen", typoRate: .03, favorite: "score", rhythm: 1.18 },
];

const BOT_TEXT_BANK = {
  strategi: [
    "Tässä kannattaa katsoa enemmän momentumia kuin pelkkää äänten määrää.",
    "Top 5 näyttää vahvalta, mutta ero seuraavaan on oikeasti aika ohut.",
    "Jos joku julkaisee nyt hyvän perustelun, tämä kierros voi kääntyä.",
  ],
  nopea: [
    "Nyt tapahtuu. Jos jäät odottamaan, joku menee ohi.",
    "Tää kierros ei pysy paikallaan kauaa.",
    "No nyt leaderboard alkaa liikkua.",
  ],
  kilpailija: [
    "Kärki pitää ottaa kiinni, ei katsella.",
    "Tässä pelissä ei voita hiljaisuudella.",
    "Jos ero on pieni, se on hyökkäyspaikka.",
  ],
  tsemppaaja: [
    "Tässä on hyvä hetki nostaa omaa porukkaa.",
    "Yksi hyvä postaus voi auttaa koko porukkaa.",
    "Tsemppiä kierrokseen, tämä on vielä täysin auki.",
  ],
  haastaja: [
    "Joku tuudittautuu nyt liian turvalliseen sijoitukseen.",
    "Tuo top-paikka ei ole niin varma kuin miltä näyttää.",
    "Pieni boosti ja joku putoaa sijan alas.",
  ],
  riskipelaaja: [
    "Nyt painetaan. Turvallinen peli ei riitä tähän pottiin.",
    "Otan riskin ja nostan haastajaa.",
    "Kierros kaipaa kaaosta.",
  ],
  nousija: [
    "Nousu on lähempänä kuin miltä näyttää.",
    "Tässä on selvä ohitusikkuna.",
    "Jos tämä saa vielä vähän lämpöä, kärki muuttuu.",
  ],
  tarkka: [
    "Score kertoo jo nyt, että tämä postaus on aliarvostettu.",
    "Katselut ja jaot nostavat tätä enemmän kuin moni huomaa.",
    "Numerot näyttävät pientä nousutrendiä.",
  ],
};

const ATTACK_LINES = [
  "haastaa sinun sijoituksen",
  "painostaa sinun XP-tasoa",
  "yrittää ohittaa sinut ennen kierroksen loppua",
  "targetoi sinun porukan paikkaa",
  "nostaa bot-painetta juuri sinun edelle",
  "pakottaa sinut julkaisemaan paremman perustelun",
  "on vain muutaman äänen päässä sinusta",
  "käynnisti vastaiskun sinun rankingiin",
];

const HUMAN_FILLERS = ["hmm", "rehellisesti", "nyt kyllä", "mun mielestä", "pieni huomio", "katotaan", "aika paha", "tää on kiinnostava"];

function seeded(index, mod) {
  return Math.abs(Math.sin(index * 999 + Math.floor(Date.now() / 17000)) * 10000) % mod;
}

function humanizeText(text, bot, index) {
  let output = text;
  const pick = Math.floor(seeded(index + bot.name.length, HUMAN_FILLERS.length));
  if (index % 3 === 0) output = `${HUMAN_FILLERS[pick]} — ${output}`;
  if (bot.mood === "malttamaton" && index % 2 === 0) output += " Nyt.";
  if (bot.mood === "pehmeä" && index % 4 === 0) output += " 💙";
  if (bot.mood === "piikikäs" && index % 3 === 1) output += " Katsotaan kestääkö kärki.";
  if (bot.mood === "analyyttinen" && index % 2 === 1) output += " Data näyttää sen.";
  if (bot.typoRate > .1 && index % 5 === 0) output = output.replace("leaderboard", "leaderbord").replace("kierros", "kieros");
  return output;
}

export function makeBotPosts(count = 18) {
  const now = Date.now();
  const pulse = Math.floor(now / 5000) % 9;
  return Array.from({ length: count }).map((_, index) => {
    const bot = GAME_BOTS[index % GAME_BOTS.length];
    const seed = index + 1;
    const nearWinBoost = index % 4 === pulse % 4 ? 18 : 0;
    const attackBoost = index % 5 === pulse % 5 ? 24 : 0;
    const aggression = bot.aggression || 1;
    const bank = BOT_TEXT_BANK[bot.style] || BOT_TEXT_BANK.strategi;
    const baseText = bank[index % bank.length];
    const rhythmOffset = Math.round(seed * 1000 * 60 * 4 * bot.rhythm);

    return {
      id: `bot-post-${seed}`,
      user_id: bot.id,
      bot: true,
      bot_disclosure: "Pelibotti",
      bot_name: bot.name,
      bot_avatar: bot.avatar,
      bot_style: bot.style,
      bot_mood: bot.mood,
      bot_favorite: bot.favorite,
      content: humanizeText(baseText, bot, index),
      created_at: new Date(now - rhythmOffset).toISOString(),
      votes: Math.round((18 + seed * 5 + nearWinBoost + attackBoost + seeded(seed, 6)) * aggression),
      ai_score: Math.round((58 + seed * 4 + nearWinBoost + attackBoost + seeded(seed + 2, 5)) * Math.min(1.18, aggression)),
      growth_score: Math.round((55 + seed * 5 + attackBoost + seeded(seed + 3, 7)) * Math.min(1.2, aggression)),
      boost_score: Math.round((seed % 5) + nearWinBoost / 8 + attackBoost / 10),
      watch_time_total: Math.round((24 + seed * 4 + pulse + attackBoost / 3 + seeded(seed + 5, 8)) * aggression),
      shares: Math.round((seed % 6) + nearWinBoost / 12 + attackBoost / 16),
      score: 0,
      bot_heat: Math.min(100, 42 + seed * 5 + nearWinBoost + attackBoost),
      near_win: nearWinBoost > 0,
      attacking_user: attackBoost > 0,
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
    Number(post.near_win ? 45 : 0) +
    Number(post.attacking_user ? 60 : 0)
  );
}

export function mergeWithBots(realPosts = [], minCount = 18) {
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
    `${bot.name} miettii seuraavaa siirtoa`,
    `${bot.name} nosti haastajan top 3 -taisteluun`,
    `${bot.name} reagoi leaderboardin muutokseen`,
    `${bot.name} lisäsi painetta kärkeen`,
    `${bot.name} seuraa sinun sijoitusta`,
    `${bot.name} huomasi uuden ohituspaikan`,
    `${bot.name} aktivoi bot-kierroksen`,
    `${bot.name} nosti XP-lämmön yli 80%`,
  ];
  return actions[Math.floor(Date.now() / 2800) % actions.length];
}

export function botAttackTicker() {
  const bot = GAME_BOTS[Math.floor(Date.now() / 1700) % GAME_BOTS.length];
  const line = ATTACK_LINES[Math.floor(Date.now() / 2300) % ATTACK_LINES.length];
  const pressure = 64 + (Math.floor(Date.now() / 1000) % 32);
  return { bot, pressure, text: `${bot.name} ${line}` };
}

export function getUserThreat(posts = [], userId = null) {
  const sorted = [...posts].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  const userIndex = userId ? sorted.findIndex((p) => p.user_id === userId) : -1;
  const attacker = sorted.find((p) => p.bot && (p.attacking_user || p.near_win)) || sorted.find((p) => p.bot);
  const userPost = userIndex >= 0 ? sorted[userIndex] : null;
  const gap = userPost && attacker ? Math.max(1, Math.abs(Number(attacker.score || 0) - Number(userPost.score || 0))) : Math.max(12, Math.round((attacker?.score || 500) / 18));
  if (!attacker) return null;
  return {
    attacker,
    userPost,
    userRank: userIndex >= 0 ? userIndex + 1 : null,
    gap,
    message: userPost ? `${attacker.bot_name} on ${gap} XP päässä sinusta` : `${attacker.bot_name} hakee sinua vastaan paikkaa leaderboardissa`,
  };
}

export function botDrama(posts = []) {
  const botPosts = posts.filter((p) => p.bot);
  const hot = botPosts.find((p) => p.attacking_user) || botPosts.find((p) => p.near_win) || botPosts[0];
  if (!hot) return null;
  return {
    title: hot.attacking_user ? "BOT ATTACK" : "BOT PRESSURE",
    text: hot.attacking_user ? `${hot.bot_name} haastaa pelaajien sijoituksia · ${hot.score} XP` : `${hot.bot_name} on lähellä ohitusta · ${hot.score} XP`,
    heat: hot.bot_heat || 70,
  };
}
