import { createClient } from "@supabase/supabase-js";

const BOT_MESSAGES = [
  "Tämä perustelu on nousemassa – yksi ääni voi ratkaista 🔥",
  "Hyvä selkeys tässä, tämä voi nousta top 3:een",
  "Tämä ansaitsee enemmän huomiota 👀",
  "Tässä on vahva tarvesignaali – kiinnostavaa",
  "Kilpailu kiristyy, tämä voi vielä voittaa 🏆"
];

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: bots } = await supabase
    .from("bot_profiles")
    .select("*")
    .eq("active", true);

  if (!bots || bots.length === 0) {
    return res.status(200).json({ ok: true, message: "no bots" });
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!posts || posts.length === 0) {
    return res.status(200).json({ ok: true, message: "no posts" });
  }

  const bot = bots[Math.floor(Math.random() * bots.length)];
  const target = posts[Math.floor(Math.random() * posts.length)];
  const message = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];

  await supabase.from("posts").insert({
    content: message,
    is_bot: true,
    bot_name: bot.name,
    bot_persona: bot.persona,
    bot_disclosure: "AI bot",
    group_id: target.group_id || null
  });

  return res.status(200).json({ ok: true });
}
