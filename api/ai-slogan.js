import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const fallback = {
  headline: "Puhu. Vakuuta. Voita.",
  subline: "Paras perustelu nousee esiin.",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mood = "default" } = req.body || {};

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: `
Luo KOLEHTI-sovellukselle yksi lyhyt suomenkielinen hero-slogan.

Sovellus:
- yhteisöllinen
- kilpailullinen
- perustelut, äänestys ja AI-ranking
- rahapotit
- suomalainen tunnelma
- sloganin pitää olla iskevä ja premium

Mood: ${mood}

Palauta vain validi JSON:
{
  "headline": "max 4 sanaa",
  "subline": "max 6 sanaa"
}
`,
    });

    const raw = response.output_text || "";
    const json = JSON.parse(raw.replace(/```json|```/g, "").trim());

    return res.status(200).json({
      headline: json.headline || fallback.headline,
      subline: json.subline || fallback.subline,
    });
  } catch {
    return res.status(200).json(fallback);
  }
}
