import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function fallbackScore(text = "") {
  const length = text.trim().length;

  if (length > 300) return 72;
  if (length > 150) return 64;
  if (length > 60) return 56;
  return 50;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      ai_score: 50,
      score: 50,
    });
  }

  try {
    const { text, content } = req.body || {};
    const inputText = String(text || content || "").trim();

    if (!inputText) {
      return res.status(400).json({
        error: "Teksti puuttuu.",
        ai_score: 50,
        score: 50,
        feedback: "Ei analysoitavaa tekstiä.",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      const score = fallbackScore(inputText);

      return res.status(200).json({
        ai_score: score,
        score,
        ai_quality: score,
        ai_need: 50,
        ai_clarity: score,
        ai_risk: 0,
        summary: "AI-avain puuttuu, käytetään varapisteytystä.",
        feedback: {
          mode: "fallback",
          message: "OPENAI_API_KEY puuttuu Vercelistä.",
        },
      });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Olet KOLEHTI-sovelluksen turvallinen AI-arvioija. Arvioit suomenkielisiä perusteluja reilusti, empaattisesti ja neutraalisti. Palauta vain JSON.",
        },
        {
          role: "user",
          content: `Arvioi tämä perustelu pisteillä 0-100. Vastaa vain JSON-muodossa:
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

    let parsed = {};

    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (error) {
      const score = fallbackScore(inputText);

      return res.status(200).json({
        ai_score: score,
        score,
        ai_quality: score,
        ai_need: 50,
        ai_clarity: score,
        ai_risk: 0,
        summary: "AI vastasi epäselvästi, käytetään varapisteytystä.",
        feedback: {
          mode: "fallback_parse_error",
          raw,
        },
      });
    }

    const score = Number(parsed.ai_score ?? parsed.score ?? fallbackScore(inputText));

    return res.status(200).json({
      ai_score: score,
      score,
      ai_quality: Number(parsed.ai_quality ?? score),
      ai_need: Number(parsed.ai_need ?? 50),
      ai_clarity: Number(parsed.ai_clarity ?? score),
      ai_risk: Number(parsed.ai_risk ?? 0),
      summary: parsed.summary || "AI-analyysi valmis.",
      feedback: parsed.feedback || parsed,
    });
  } catch (error) {
    console.error("AI backend error:", error);

    return res.status(200).json({
      ai_score: 50,
      score: 50,
      ai_quality: 50,
      ai_need: 50,
      ai_clarity: 50,
      ai_risk: 0,
      summary: "AI backend epäonnistui, käytetään varapisteytystä.",
      feedback: {
        mode: "server_fallback",
        error: error.message,
      },
    });
  }
}
