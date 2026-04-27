import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function fallbackImprove(text = "") {
  const clean = String(text).trim();
  if (!clean) {
    return {
      improved: "",
      tips: ["Kirjoita ensin lyhyt perustelu."]
    };
  }

  const improved = clean.length < 80
    ? `${clean}\n\nTämä olisi minulle tärkeää, koska se auttaisi arjessa konkreettisesti ja antaisi mahdollisuuden päästä eteenpäin.`
    : clean;

  return {
    improved,
    tips: [
      "Lisää konkreettinen syy.",
      "Kerro mihin apu vaikuttaa heti.",
      "Pidä teksti selkeänä ja aitona."
    ]
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body || {};
  const inputText = String(text || "").trim();

  if (!inputText) {
    return res.status(200).json(fallbackImprove(""));
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json(fallbackImprove(inputText));
  }

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "Olet KOLEHTI-sovelluksen Creator AI. Paranna käyttäjän omaa perustelua, mutta älä keksi uusia henkilökohtaisia faktoja. Älä liioittele. Tee tekstistä selkeämpi, konkreettisempi ja empaattinen. Palauta vain JSON."
        },
        {
          role: "user",
          content: `Paranna tämä perustelu. Palauta JSON muodossa {"improved":"...", "tips":["...","..."]}.\n\nTeksti:\n${inputText}`
        }
      ]
    });

    const raw = response.output_text || "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

    return res.status(200).json({
      improved: String(parsed.improved || inputText).slice(0, 1200),
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 4) : fallbackImprove(inputText).tips
    });
  } catch (error) {
    console.error("Creator AI failed:", error);
    return res.status(200).json(fallbackImprove(inputText));
  }
}
