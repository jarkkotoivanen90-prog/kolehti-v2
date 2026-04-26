import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanJson(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body || {};

    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        error: "Kirjoita pidempi perustelu ennen AI-analyysiä.",
      });
    }

    const prompt = `
Olet KOLEHTI-sovelluksen AI-mentori.

Analysoi käyttäjän suomenkielinen perustelu.
Tavoite: auta käyttäjää kirjoittamaan aidompi, selkeämpi ja uskottavampi perustelu.

Palauta AINOASTAAN validi JSON tässä muodossa:

{
  "score": 0-100,
  "clarity": 0-100,
  "emotion": 0-100,
  "trust": 0-100,
  "summary": "lyhyt yhteenveto",
  "strengths": ["vahvuus 1", "vahvuus 2"],
  "improvements": ["parannus 1", "parannus 2", "parannus 3"],
  "improved_text": "parannettu versio käyttäjän tekstistä"
}

Perustelu:
${text}
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      input: prompt,
    });

    const raw = response.output_text || "";
    const parsed = JSON.parse(cleanJson(raw));

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({
      error: "AI-analyysi epäonnistui.",
      details: error.message,
    });
  }
}
