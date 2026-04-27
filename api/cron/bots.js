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

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!bots?.length || !posts?.length) {
    return res.status(200).json({ ok: true });
  }

  const bot = bots[Math.floor(Math.random() * bots.length)];
  const target = posts[Math.floor(Math.random() * posts.length)];

  // 1. Bot creates post
  if (Math.random() < 0.4) {
    const message = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];

    await supabase.from("posts").insert({
      content: message,
      is_bot: true,
      bot_name: bot.name,
      bot_persona: bot.persona,
      bot_disclosure: "AI bot",
      group_id: target.group_id || null
    });
  }

  // 2. Bot reacts (safe, not real vote)
  const reactionWeight = Math.floor(Math.random() * 3) + 1;

  await supabase.from("bot_reactions").insert({
    bot_id: bot.id,
    post_id: target.id,
    reaction: "support",
    weight: reactionWeight,
    message: "AI bot reaction"
  });

  await supabase
    .from("posts")
    .update({
      bot_reaction_score: (target.bot_reaction_score || 0) + reactionWeight,
      bot_reaction_count: (target.bot_reaction_count || 0) + 1
    })
    .eq("id", target.id);

  return res.status(200).json({ ok: true });
}
