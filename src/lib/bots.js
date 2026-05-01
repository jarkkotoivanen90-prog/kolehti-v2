export const GAME_BOTS = [
  { id: "bot-aino", name: "Aino", avatar: "A", style: "strategi", aggression: 1.16, mood: "rauhallinen", typoRate: .08, favorite: "potti", rhythm: 1.05, voice: "calmStrategist" },
  { id: "bot-veeti", name: "Veeti", avatar: "V", style: "nopea", aggression: 1.28, mood: "malttamaton", typoRate: .16, favorite: "feed", rhythm: .72, voice: "fastChallenger" },
  { id: "bot-sisu", name: "Sisu", avatar: "S", style: "kilpailija", aggression: 1.42, mood: "suora", typoRate: .06, favorite: "leaderboard", rhythm: .9, voice: "directCompetitor" },
  { id: "bot-lumi", name: "Lumi", avatar: "L", style: "tsemppaaja", aggression: 1.08, mood: "pehmeä", typoRate: .04, favorite: "porukka", rhythm: 1.35, voice: "warmSupporter" },
  { id: "bot-kaapo", name: "Kaapo", avatar: "K", style: "haastaja", aggression: 1.34, mood: "piikikäs", typoRate: .14, favorite: "ohitus", rhythm: .82, voice: "teasingRival" },
  { id: "bot-myrsky", name: "Myrsky", avatar: "M", style: "riskipelaaja", aggression: 1.58, mood: "aggressiivinen", typoRate: .12, favorite: "hyökkäys", rhythm: .66, voice: "chaosAggressor" },
  { id: "bot-nova", name: "Nova", avatar: "N", style: "nousija", aggression: 1.48, mood: "itsevarma", typoRate: .07, favorite: "nousu", rhythm: .78, voice: "confidentClimber" },
  { id: "bot-kide", name: "Kide", avatar: "K", style: "tarkka", aggression: 1.22, mood: "analyyttinen", typoRate: .03, favorite: "score", rhythm: 1.18, voice: "dataAnalyst" },
];

const MEMORY_KEY = "kolehti_bot_memory_v1";
const DIALOGUE_KEY = "kolehti_bot_dialogue_v1";
const REPLY_KEY = "kolehti_bot_replies_v1";

const DEFAULT_MEMORY = { encounters: 0, playerWins: 0, botWins: 0, rivalId: "bot-myrsky", lastSeenAt: 0, botHistory: {}, weekPosts: {} };

const VOICES = {
  calmStrategist: { opener: ["Rauhallisesti katsottuna", "Pieni strateginen huomio", "Tätä ei kannata hätäillä"], closer: ["Katsotaan mihin tämä kääntyy.", "Momentum ratkaisee.", "Pieni ero voi olla iso merkki."], verbs: ["lasken", "seuraan", "arvioin"], emoji: "" },
  fastChallenger: { opener: ["No nyt", "Heti nyt", "Ei jäädä tähän"], closer: ["Vauhtia.", "Nyt mennään.", "Älä jää odottamaan."], verbs: ["painaan", "hyppään", "nostan"], emoji: "⚡" },
  directCompetitor: { opener: ["Suoraan sanottuna", "Selvä peli", "Tässä ei selitellä"], closer: ["Voitto pitää ottaa.", "Kärki kiinni.", "Ei armoa leaderboardissa."], verbs: ["haastan", "otan", "ohitan"], emoji: "" },
  warmSupporter: { opener: ["Hei hyvä yritys", "Tässä on potentiaalia", "Mä tykkään tästä suunnasta"], closer: ["Vielä vähän lisää lämpöä 💙", "Porukka voi nousta tästä.", "Tämä ei ole vielä ohi 💙"], verbs: ["tsemppaan", "nostan", "seuraan"], emoji: "💙" },
  teasingRival: { opener: ["Aika varma olo siellä?", "Katotaan nyt", "Tuo paikka näyttää vähän huteralta"], closer: ["Katsotaan kestääkö.", "Saatan tulla ohi.", "Älä tuudittaudu."], verbs: ["kiusaan", "haastan", "hiivin"], emoji: "😏" },
  chaosAggressor: { opener: ["Nyt rikotaan pakka", "Kaaos tekee tästä hauskaa", "Mä en odota"], closer: ["Nyt painetaan.", "Teen tästä vaikean.", "Kärki saa varoa."], verbs: ["hyökkään", "rikon", "pakotan"], emoji: "🔥" },
  confidentClimber: { opener: ["Nousu on jo käynnissä", "Tää on mun ikkuna", "Mä näen reitin ylös"], closer: ["Seuraava sija on lähellä.", "Nousu jatkuu.", "Tämä kääntyy vielä."], verbs: ["nousen", "ohitan", "kiihdytän"], emoji: "✨" },
  dataAnalyst: { opener: ["Data sanoo näin", "Numeroiden perusteella", "Jos katsoo scorea"], closer: ["Trendikäyrä näyttää ylös.", "Tämä on mitattavissa.", "Pisteet eivät valehtele."], verbs: ["mittaan", "lasken", "vertailen"], emoji: "📊" },
};

const BOT_MEDIA = [
  { type: "image", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Finnish_lake_and_forest_landscape_(175928795).jpg?width=1200" },
  { type: "image", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Helsinki_skyline_(Sep_2024_-_01).jpg?width=1200" },
  { type: "image", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Aurora_borealis_(21868630118).jpg?width=1200" },
  { type: "image", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Ikaalinen_-_lake_and_forest.jpg?width=1200" },
  { type: "image", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Road_in_Finland.jpg?width=1200" },
  { type: "image", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Muuratj%C3%A4rvi_Lake_and_Forest%2C_Finland%2C_August_2013.JPG?width=1200" },
];

const WEEKLY_REASONS = {
  calmStrategist: "Tarvitsen tämän potin, koska olen rakentanut rauhassa yhden hyvän suunnitelman: pystyisin käyttämään voiton suoraan arjen paineen keventämiseen ja seuraavan askeleen tekemiseen ilman hätäilyä. Tämä ei ole hetken mielijohde, vaan tarkkaan mietitty syy osallistua.",
  fastChallenger: "Tarvitsen tämän potin, koska minulla on juuri nyt tilanne jossa nopea apu muuttaisi paljon. En halua selitellä liikaa — yksi hyvä mahdollisuus oikeaan aikaan voi kääntää koko viikon suunnan.",
  directCompetitor: "Tarvitsen tämän potin, koska olen päättänyt hoitaa yhden ison asian pois tieltä. En hae sääliä, vaan mahdollisuutta näyttää että yhdellä vahvalla perustelulla voi voittaa reilusti.",
  warmSupporter: "Tarvitsen tämän potin, koska se auttaisi minua ja samalla myös läheisiä ympärilläni. En pelaa vain itseäni varten — haluan käyttää voiton johonkin konkreettiseen, joka helpottaa useamman ihmisen arkea 💙",
  teasingRival: "Tarvitsen tämän potin, koska joku muu luulee ehkä olevansa varma voittaja. Minulla on kuitenkin yksi hyvä syy ja yksi hyvä hetki näyttää, että altavastaaja voi mennä ohi, kun perustelu osuu kohdalleen.",
  chaosAggressor: "Tarvitsen tämän potin, koska tilanne on yksinkertainen: nyt pitää tehdä rohkea siirto. Käyttäisin voiton asiaan, jota olen lykännyt liian pitkään, ja tämä kierros on juuri se hetki jolloin en aio jäädä sivuun 🔥",
  confidentClimber: "Tarvitsen tämän potin, koska olen nousemassa pois yhdestä jumitilanteesta. Voitto antaisi vauhtia seuraavaan vaiheeseen ja todistaisi, että hyvä perustelu voi avata oikean oven oikealla hetkellä ✨",
  dataAnalyst: "Tarvitsen tämän potin, koska numeroiden valossa yksi oikea lisäresurssi vaikuttaisi suoraan tilanteeseeni. Tämä ei ole vain toive, vaan selkeä vaikutus: voitto vähentäisi painetta ja antaisi mahdollisuuden tehdä seuraava päätös paremmin 📊",
};

export function readBotMemory() { try { const raw = localStorage.getItem(MEMORY_KEY); return raw ? { ...DEFAULT_MEMORY, ...JSON.parse(raw) } : { ...DEFAULT_MEMORY }; } catch { return { ...DEFAULT_MEMORY }; } }
export function writeBotMemory(next) { try { localStorage.setItem(MEMORY_KEY, JSON.stringify({ ...DEFAULT_MEMORY, ...next, lastSeenAt: Date.now() })); } catch {} }
export function readBotDialogueMemory() { try { const raw = localStorage.getItem(DIALOGUE_KEY); return raw ? JSON.parse(raw) : { seen: {}, lastDialogueAt: 0 }; } catch { return { seen: {}, lastDialogueAt: 0 }; } }
export function writeBotDialogueMemory(next) { try { localStorage.setItem(DIALOGUE_KEY, JSON.stringify({ seen: {}, lastDialogueAt: Date.now(), ...next })); } catch {} }
export function readBotReplyMemory() { try { const raw = localStorage.getItem(REPLY_KEY); return raw ? JSON.parse(raw) : { byPost: {}, totalReplies: 0 }; } catch { return { byPost: {}, totalReplies: 0 }; } }
export function writeBotReplyMemory(next) { try { localStorage.setItem(REPLY_KEY, JSON.stringify({ byPost: {}, totalReplies: 0, ...next, updatedAt: Date.now() })); } catch {} }

function getWeekId() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const pastDays = Math.floor((now - firstDay) / 86400000);
  return `${now.getFullYear()}-W${Math.ceil((pastDays + firstDay.getDay() + 1) / 7)}`;
}

function seeded(index, mod) { return Math.abs(Math.sin(index * 999 + Math.floor(Date.now() / 17000)) * 10000) % mod; }
function pick(arr, index) { return arr[Math.floor(seeded(index + arr.length, arr.length))]; }

function getBotMemoryState(bot) {
  const memory = readBotMemory();
  const history = memory.botHistory?.[bot.id] || { encounters: 0, wins: 0, losses: 0, grudge: 0 };
  const isRival = memory.rivalId === bot.id;
  const revenge = Math.min(1.22, 1 + Number(history.grudge || 0) / 260 + (isRival ? 0.08 : 0));
  return { memory, history, isRival, revenge };
}

function applyVoice(bot, core, index, context = "post") {
  const voice = VOICES[bot.voice] || VOICES.calmStrategist;
  let line = context === "reply" || context === "dialogue" ? `${pick(voice.opener, index)}. ${core}` : `${core}`;
  if ((context === "reply" || context === "dialogue") && index % 2 === 0) line += ` ${pick(voice.closer, index + 3)}`;
  if ((context === "reply" || context === "dialogue") && voice.emoji && index % 3 !== 1) line += ` ${voice.emoji}`;
  if (bot.typoRate > .1 && context !== "post" && index % 5 === 0) line = line.replace("leaderboard", "leaderbord").replace("kierros", "kieros");
  return line;
}

export function recordBotEncounter({ userWon = false, botId = "bot-myrsky", gap = 0 } = {}) {
  const memory = readBotMemory();
  const history = memory.botHistory || {};
  const previous = history[botId] || { encounters: 0, wins: 0, losses: 0, grudge: 0 };
  const updated = { ...previous, encounters: previous.encounters + 1, wins: previous.wins + (userWon ? 0 : 1), losses: previous.losses + (userWon ? 1 : 0), grudge: Math.min(100, Math.max(0, previous.grudge + (userWon ? 12 : -4) + Math.min(8, Math.round(gap / 80)))), lastGap: gap, lastSeenAt: Date.now() };
  writeBotMemory({ ...memory, encounters: memory.encounters + 1, playerWins: memory.playerWins + (userWon ? 1 : 0), botWins: memory.botWins + (userWon ? 0 : 1), rivalId: updated.grudge > 35 ? botId : memory.rivalId, botHistory: { ...history, [botId]: updated } });
}

function makeWeeklyBotEntry(bot, index) {
  const weekId = getWeekId();
  const state = getBotMemoryState(bot);
  const media = BOT_MEDIA[index % BOT_MEDIA.length];
  const baseVotes = Math.round((22 + index * 7 + Number(state.history.grudge || 0) / 8) * (bot.aggression || 1) * state.revenge);
  const content = WEEKLY_REASONS[bot.voice] || WEEKLY_REASONS.calmStrategist;
  return {
    id: `bot-week-${bot.id}-${weekId}`,
    user_id: bot.id,
    bot: true,
    bot_disclosure: "Pelibotti · 1 osallistuminen / viikko",
    bot_name: bot.name,
    bot_avatar: bot.avatar,
    bot_style: bot.style,
    bot_mood: bot.mood,
    bot_voice: bot.voice,
    bot_favorite: bot.favorite,
    bot_rival: state.isRival,
    bot_memory: state.history,
    weekly_entry: true,
    locked: true,
    week_id: weekId,
    content,
    media_type: media.type,
    media_url: media.url,
    created_at: new Date(Date.now() - index * 1000 * 60 * 17).toISOString(),
    votes: baseVotes,
    ai_score: Math.round(72 + index * 2 + (content.length > 220 ? 10 : 0)),
    growth_score: Math.round(68 + index * 3),
    boost_score: Math.round(2 + index / 2 + Number(state.history.grudge || 0) / 30),
    watch_time_total: Math.round(26 + index * 5),
    shares: Math.round(1 + index / 2),
    score: 0,
    bot_heat: Math.min(100, 48 + index * 5 + Number(state.history.grudge || 0) / 2),
    near_win: state.isRival,
    attacking_user: false,
  };
}

export function makeBotPosts() {
  const memory = readBotMemory();
  const weekId = getWeekId();
  const cached = memory.weekPosts || {};
  const entries = GAME_BOTS.map((bot, index) => {
    const existing = cached[bot.id];
    if (existing?.weekId === weekId && existing?.post) return existing.post;
    return makeWeeklyBotEntry(bot, index);
  });

  const nextWeekPosts = {};
  entries.forEach((post) => { nextWeekPosts[post.user_id] = { weekId, post }; });
  writeBotMemory({ ...memory, weekPosts: nextWeekPosts });
  return entries;
}

function analyzePost(post = {}) {
  const text = String(post.content || "").toLowerCase();
  const length = text.length;
  const hasWhy = /koska|siksi|miksi|perustelu|tämän takia/.test(text);
  const hasEnergy = /voita|paras|pakko|nyt|raha|potti|finaali|top/.test(text);
  return { length, hasWhy, hasEnergy, isShort: length < 55, isStrong: hasWhy && length > 90, topic: text.includes("potti") ? "potti" : text.includes("porukka") ? "porukka" : text.includes("voita") ? "voitto" : "perustelu" };
}

export function makeBotReply(post = {}, { context = "feed", forceBotId = null } = {}) {
  const memory = readBotMemory();
  const replyMemory = readBotReplyMemory();
  const analysis = analyzePost(post);
  const rival = GAME_BOTS.find((b) => b.id === memory.rivalId) || GAME_BOTS[0];
  const bot = forceBotId ? GAME_BOTS.find((b) => b.id === forceBotId) || rival : (analysis.isStrong ? GAME_BOTS.find((b) => b.voice === "dataAnalyst") || rival : rival);
  const state = getBotMemoryState(bot);
  const postId = post.id || `temp-${String(post.content || "").slice(0, 16)}`;
  const seen = replyMemory.byPost?.[postId] || 0;
  const cores = [];
  if (analysis.isShort) cores.push("tämä on vähän lyhyt, mutta siinä on ideaa jos perustelu tarkentuu");
  if (analysis.isStrong) cores.push("tässä on oikea perustelu, siksi seuraan tätä tarkasti");
  if (analysis.hasEnergy) cores.push("tässä on pottiin sopivaa painetta");
  if (analysis.topic === "porukka") cores.push("porukka voi saada tästä hyvän XP-noston");
  if (state.isRival) cores.push("muistan sinut tältä kierrokselta, mutta yksi hyvä postaus ratkaisee");
  if (!cores.length) cores.push("tämä voi nousta, jos se saa ääniä tällä viikolla");
  const core = cores[seen % cores.length];
  const text = applyVoice(bot, core, seen + Number(post.score || 0), "reply");
  const reply = { id: `reply-${postId}-${bot.id}-${seen}`, post_id: postId, bot: true, bot_name: bot.name, bot_avatar: bot.avatar, bot_voice: bot.voice, disclosure: "Pelibotti", text, pressure: Math.min(100, 35 + Number(state.history.grudge || 0) + Number(post.score || 0) / 60), created_at: new Date().toISOString(), intent: analysis.isStrong ? "respect" : state.isRival ? "challenge" : "nudge" };
  writeBotReplyMemory({ ...replyMemory, totalReplies: Number(replyMemory.totalReplies || 0) + 1, byPost: { ...(replyMemory.byPost || {}), [postId]: seen + 1 } });
  return reply;
}

export function makeBotRepliesForPost(post = {}, count = 2) {
  const first = makeBotReply(post, { context: "feed" });
  const secondBot = GAME_BOTS.find((b) => b.id !== first.bot?.id && (b.voice === "warmSupporter" || b.voice === "teasingRival"));
  const replies = [first];
  if (count > 1 && secondBot) replies.push(makeBotReply(post, { context: "feed", forceBotId: secondBot.id }));
  return replies;
}

export function botScore(post) { return Math.round(Number(post.votes || 0) * 12 + Number(post.ai_score || 50) + Number(post.growth_score || 50) * 0.55 + Number(post.boost_score || 0) * 4 + Number(post.watch_time_total || 0) * 2 + Number(post.shares || 0) * 6 + Number(post.near_win ? 25 : 0) + Number(post.bot_rival ? 35 : 0)); }

export function mergeWithBots(realPosts = []) {
  const bots = makeBotPosts();
  const normalizedReal = (realPosts || []).map((post, index) => ({ ...post, bot: false, bot_name: "Pelaaja", votes: Number(post.votes || post.vote_count || 0), ai_score: Number(post.ai_score || post.growth_score || 50), growth_score: Number(post.growth_score || post.ai_score || 50), boost_score: Number(post.boost_score || 0), watch_time_total: Number(post.watch_time_total || 0), shares: Number(post.shares || 0), score: botScore(post) + 35 + index }));
  const normalizedBots = bots.map((post) => ({ ...post, score: botScore(post) }));
  return [...normalizedReal, ...normalizedBots].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

export function botTicker() {
  const memory = readBotMemory();
  const rival = GAME_BOTS.find((b) => b.id === memory.rivalId) || GAME_BOTS[0];
  const voice = VOICES[rival.voice] || VOICES.calmStrategist;
  const actions = [`${rival.name}: ${pick(voice.opener, 1).toLowerCase()} — yksi postaus tällä viikolla ratkaisee`, `${rival.name}: ${pick(voice.verbs, 3)} omaa viikkoperustelua`, `${rival.name}: ${pick(voice.closer, 4)}`, `${rival.name}: seuraan viikon pottia`];
  return actions[Math.floor(Date.now() / 4800) % actions.length];
}

export function botAttackTicker() {
  const memory = readBotMemory();
  const bot = GAME_BOTS.find((b) => b.id === memory.rivalId) || GAME_BOTS[0];
  const pressure = 48 + (Math.floor(Date.now() / 1000) % 22) + Math.round((memory.botHistory?.[bot.id]?.grudge || 0) / 8);
  return { bot, pressure, text: `${bot.name} puolustaa omaa viikkoperusteluaan` };
}

export function makeBotDialogue({ context = "feed", userRank = null, gap = null, postContent = "", threat = null } = {}) {
  const memory = readBotMemory();
  const dialogueMemory = readBotDialogueMemory();
  const rival = GAME_BOTS.find((b) => b.id === memory.rivalId) || GAME_BOTS[0];
  const bot = threat?.attacker?.bot_name ? GAME_BOTS.find((b) => b.name === threat.attacker.bot_name) || rival : rival;
  const state = getBotMemoryState(bot);
  const seenCount = dialogueMemory.seen?.[bot.id] || 0;
  const contextCore = context === "pots" ? `potti kasvaa, mutta vain viikon paras perustelu ratkaisee` : context === "profile" ? `huomasin sinun XP-tason, nyt ratkaisee yksi hyvä postaus` : context === "win" ? `voitit tämän viikon perustelulla, muistan sen` : context === "lose" ? `tällä viikolla minun perustelu vei edelle` : userRank ? `olet sijalla #${userRank}, mutta viikkopeli on vielä auki` : `yksi vahva perustelu voi vielä muuttaa leaderboardin`;
  let text = applyVoice(bot, contextCore, seenCount, "dialogue");
  if (state.isRival && state.history.grudge > 35) text += " Tämä viikko ratkaisee.";
  writeBotDialogueMemory({ ...dialogueMemory, seen: { ...(dialogueMemory.seen || {}), [bot.id]: seenCount + 1 }, lastDialogueAt: Date.now() });
  return { bot, text, context, pressure: Math.min(100, 45 + Number(state.history.grudge || 0) + (state.isRival ? 12 : 0)), disclosure: "Pelibotti", voice: bot.voice };
}

export function getUserThreat(posts = [], userId = null) {
  const sorted = [...posts].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  const userIndex = userId ? sorted.findIndex((p) => p.user_id === userId) : -1;
  const attacker = sorted.find((p) => p.bot && p.bot_rival) || sorted.find((p) => p.bot);
  const userPost = userIndex >= 0 ? sorted[userIndex] : null;
  const gap = userPost && attacker ? Math.max(1, Math.abs(Number(attacker.score || 0) - Number(userPost.score || 0))) : Math.max(12, Math.round((attacker?.score || 500) / 18));
  if (!attacker) return null;
  return { attacker, userPost, userRank: userIndex >= 0 ? userIndex + 1 : null, gap, message: userPost ? `${attacker.bot_name} on ${gap} XP päässä samalla viikkopostauksella` : `${attacker.bot_name} kilpailee omalla viikkoperustelullaan` };
}

export function botDrama(posts = []) {
  const botPosts = posts.filter((p) => p.bot);
  const hot = botPosts.find((p) => p.bot_rival) || botPosts[0];
  if (!hot) return null;
  return { title: hot.bot_rival ? "RIVAL ENTRY" : "BOT ENTRY", text: `${hot.bot_name}: yksi viikkoperustelu · ${hot.score} XP`, heat: hot.bot_heat || 55 };
}
