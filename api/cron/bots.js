import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FALLBACK_CONTENT = [
  "Tarvitsen apua arjen kuluihin, jotta pääsen takaisin jaloilleni.",
  "Tämä tuki auttaisi minua keskittymään opiskeluun ilman jatkuvaa stressiä.",
  "Pieni apu nyt voisi estää isommat ongelmat myöhemmin.",
  "Haluan rakentaa vakaamman arjen ja tämä olisi iso askel siihen.",
  "Tuki menisi suoraan välttämättömiin kuluihin kuten vuokraan ja ruokaan."
];

function fallbackContent() {
  return FALLBACK_CONTENT[Math.floor(Math.random() * FALLBACK_CONTENT.length)];
}

function cleanupBotText(text = "") {
  return String(text)
    .replace(/```json|```/g, "")
    .replace(/^"|"$/g, "")
    .trim()
    .slice(0, 700);
}

async function generateBotContent(bot) {
  if (!process.env.OPENAI_API_KEY) return fallbackContent();

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Olet KOLEHTI-sovelluksen AI/NPC-botti. Kirjoita lyhyt suomenkielinen botin perustelu tai haasteviesti. Sisällön pitää olla turvallinen, neutraali, empaattinen ja selvästi sovelluksen pelillinen NPC-sisältö. Älä väitä olevasi oikea ihminen. Älä kerro henkilötietoja. Älä mainitse rahasummia. Vastaa vain tekstillä, ei JSONia."
        },
        {
          role: "user",
          content: `Botin nimi: ${bot.name}\nPersona: ${bot.persona}\nSävy: ${bot.tone || "supportive"}\n\nKirjoita yksi 1-3 lauseen KOLEHTI feed -postaus, joka kannustaa käyttäjiä osallistumaan Bot vs User -haasteeseen.`
        }
      ]
    });

    const text = cleanupBotText(response.output_text || "");
    return text.length >= 30 ? text : fallbackContent();
  } catch (error) {
    console.error("Bot content generation failed:", error);
    return fallbackContent();
  }
}

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
  const content = await generateBotContent(bot);

  const { data: newPost, error } = await supabase
    .from("posts")
    .insert({
      content,
      is_bot: true,
      bot_name: bot.name,
      bot_persona: bot.persona,
      bot_disclosure: "AI bot · NPC content",
      bot_id: bot.id,
      challenge_mode: true,
      challenge_label: "Bot vs User",
      ai_score: 65,
      ai_quality: 65,
      ai_need: 55,
      ai_clarity: 75,
      ai_risk: 0,
      ai_feedback: {
        mode: process.env.OPENAI_API_KEY ? "openai_bot_generation" : "fallback_bot_generation",
        bot_name: bot.name,
        disclosure: "AI bot · NPC content"
      }
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  if (newPost) {
    await supabase.from("bot_challenges").insert({
      bot_id: bot.id,
      post_id: newPost.id,
      bot_score: Math.floor(Math.random() * 5),
      user_score: 0
    });

    await supabase
      .from("bot_profiles")
      .update({
        score: Number(bot.score || 0) + 1,
        last_active_at: new Date().toISOString()
      })
      .eq("id", bot.id);
  }

  return res.status(200).json({ ok: true, generated: true, bot: bot.name });
}
