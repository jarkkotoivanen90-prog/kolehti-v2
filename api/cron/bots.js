import { createClient } from "@supabase/supabase-js";

const AI_CONTENT = [
  "Tarvitsen apua arjen kuluihin, jotta pääsen takaisin jaloilleni.",
  "Tämä tuki auttaisi minua keskittymään opiskeluun ilman jatkuvaa stressiä.",
  "Pieni apu nyt voisi estää isommat ongelmat myöhemmin.",
  "Haluan rakentaa vakaamman arjen ja tämä olisi iso askel siihen.",
  "Tuki menisi suoraan välttämättömiin kuluihin kuten vuokraan ja ruokaan."
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

  if (!bots?.length) return res.status(200).json({ ok: true });

  const bot = bots[Math.floor(Math.random() * bots.length)];

  // 1. AI bot creates real-style post
  const content = AI_CONTENT[Math.floor(Math.random() * AI_CONTENT.length)];

  const { data: newPost } = await supabase
    .from("posts")
    .insert({
      content,
      is_bot: true,
      bot_name: bot.name,
      bot_persona: bot.persona,
      bot_disclosure: "AI bot",
      bot_id: bot.id,
      challenge_mode: true,
      challenge_label: "Bot vs User",
    })
    .select()
    .single();

  if (newPost) {
    await supabase.from("bot_challenges").insert({
      bot_id: bot.id,
      post_id: newPost.id,
      bot_score: Math.floor(Math.random() * 5),
      user_score: 0
    });
  }

  return res.status(200).json({ ok: true });
}
