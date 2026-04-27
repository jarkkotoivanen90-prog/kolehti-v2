import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function countMatches(text, words) {
  const lower = text.toLowerCase();
  return words.reduce((sum, word) => sum + (lower.includes(word) ? 1 : 0), 0);
}

function fallbackAnalysis(text = "") {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const length = clean.length;
  const words = clean.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-zåäö0-9]/gi, "")));
  const sentenceCount = Math.max(1, clean.split(/[.!?\n]+/).filter((s) => s.trim().length > 0).length);
  const avgWordLength = words.length ? words.join("").length / words.length : 0;
  const repetitionRatio = words.length ? uniqueWords.size / words.length : 0;

  const concreteWords = countMatches(lower, [
    "koska",
    "siksi",
    "tarvitsen",
    "auttaa",
    "perhe",
    "lapsi",
    "lapset",
    "työ",
    "opiskelu",
    "sairaus",
    "velka",
    "ruoka",
    "vuokra",
    "lasku",
    "tilanne",
    "tavoite",
    "muutos",
    "yhteisö",
    "porukka",
  ]);

  const urgencyWords = countMatches(lower, [
    "nyt",
    "heti",
    "kiire",
    "vaikea",
    "hätä",
    "tarve",
    "puuttuu",
    "en pysty",
    "apua",
    "selvitä",
  ]);

  const riskyWords = countMatches(lower, [
    "vihaan",
    "tapa",
    "huijaa",
    "pakko maksaa",
    "uhkaa",
    "kostaa",
    "väkivalta",
    "itseäni",
  ]);

  const clarityBase =
    35 +
    Math.min(25, sentenceCount * 5) +
    Math.min(20, words.length * 0.8) +
    (repetitionRatio > 0.65 ? 10 : 0) +
    (avgWordLength >= 4 ? 5 : 0);

  const qualityBase =
    30 +
    Math.min(25, length / 12) +
    concreteWords * 5 +
    (clean.includes("?") ? 2 : 0) +
    (clean.includes("!") ? 2 : 0) -
    (repetitionRatio < 0.45 ? 12 : 0);

  const needBase = 35 + urgencyWords * 8 + concreteWords * 3 + Math.min(15, length / 35);
  const riskBase = riskyWords * 18 + (length < 25 ? 8 : 0);

  const ai_quality = clamp(qualityBase, 20, 96);
  const ai_clarity = clamp(clarityBase, 20, 96);
  const ai_need = clamp(needBase, 15, 96);
  const ai_risk = clamp(riskBase, 0, 95);

  const ai_score = clamp(
    ai_quality * 0.42 +
      ai_need * 0.28 +
      ai_clarity * 0.24 -
      ai_risk * 0.35,
    5,
    98
  );

  return {
    ai_score,
    score: ai_score,
    ai_quality,
    ai_need,
    ai_clarity,
    ai_risk,
    summary: "Varapisteytys laskettu tekstin pituuden, selkeyden, konkreettisuuden ja riskisanojen perusteella.",
    feedback: {
      mode: "local_fallback_v2",
      length,
      words: words.length,
      unique_words: uniqueWords.size,
      concrete_signals: concreteWords,
      urgency_signals: urgencyWords,
      risk_signals: riskyWords,
    },
  };
}

function normalizeAnalysis(parsed, inputText) {
  const fallback = fallbackAnalysis(inputText);
  const ai_quality = clamp(parsed.ai_quality ?? fallback.ai_quality, 0, 100);
  const ai_need = clamp(parsed.ai_need ?? fallback.ai_need, 0, 100);
  const ai_clarity = clamp(parsed.ai_clarity ?? fallback.ai_clarity, 0, 100);
  const ai_risk = clamp(parsed.ai_risk ?? fallback.ai_risk, 0, 100);

  const rawScore = parsed.ai_score ?? parsed.score;
  const ai_score = Number.isFinite(Number(rawScore))
    ? clamp(rawScore, 0, 100)
    : clamp(ai_quality * 0.42 + ai_need * 0.28 + ai_clarity * 0.24 - ai_risk * 0.35, 5, 98);

  return {
    ai_score,
    score: ai_score,
    ai_quality,
    ai_need,
    ai_clarity,
    ai_risk,
    summary: parsed.summary || fallback.summary,
    feedback: parsed.feedback || parsed,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      ...fallbackAnalysis(""),
    });
  }

  try {
    const { text, content } = req.body || {};
    const inputText = String(text || content || "").trim();

    if (!inputText) {
      return res.status(400).json({
        error: "Teksti puuttuu.",
        ...fallbackAnalysis(""),
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json(fallbackAnalysis(inputText));
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Olet KOLEHTI-sovelluksen arvioija. Arvioi jokainen perustelu erikseen. Älä anna kaikille keskitasoa. Käytä koko asteikkoa 0-100. Palauta vain validi JSON ilman markdownia.",
        },
        {
          role: "user",
          content: `Arvioi tämä suomenkielinen perustelu. Anna pisteet selvästi sisällön mukaan, ei aina 50-70 väliin.

Kriteerit:
- ai_quality: perustelun vahvuus ja konkreettisuus
- ai_need: tarve / merkityksellisyys
- ai_clarity: selkeys ja ymmärrettävyys
- ai_risk: riski, epäasiallinen sisältö tai manipulatiivisuus
- ai_score: kokonaispisteet 0-100

Palauta vain JSON:
{
  "ai_score": number,
  "score": number,
  "ai_quality": number,
  "ai_need": number,
  "ai_clarity": number,
  "ai_risk": number,
  "summary": string,
  "feedback": string
}

Perustelu:
${inputText}`,
        },
      ],
    });

    const raw = response.output_text || "";

    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      return res.status(200).json(normalizeAnalysis(parsed, inputText));
    } catch (error) {
      return res.status(200).json({
        ...fallbackAnalysis(inputText),
        feedback: {
          ...fallbackAnalysis(inputText).feedback,
          mode: "fallback_parse_error",
          raw,
        },
      });
    }
  } catch (error) {
    console.error("AI backend error:", error);
    return res.status(200).json({
      ...fallbackAnalysis(String(req.body?.text || req.body?.content || "")),
      feedback: {
        mode: "server_fallback_v2",
        error: error.message,
      },
    });
  }
}
