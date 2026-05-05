function fallback(text) {
  const clean = String(text || "").trim();
  const score = Math.max(35, Math.min(92, 45 + Math.round(clean.length / 10)));

  return {
    score,
    ai_score: score,
    ai_quality: Math.min(100, score + 3),
    ai_need: Math.max(30, score - 5),
    ai_clarity: Math.min(100, score),
    ai_risk: 0,
    label: score >= 80 ? "Vahva perustelu" : score >= 60 ? "Hyvä alku" : "Paranna vielä",
    tip:
      score >= 80
        ? "Tämä on jo selkeä ja uskottava."
        : "Lisää konkreettinen syy ja kerro, miten tuki muuttaisi tilannetta.",
    rewrite: clean,
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { text } = req.body || {};
    const clean = String(text || "").trim();

    if (!clean) {
      return res.status(400).json({ error: "No text provided" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json(fallback(clean));
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.45,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Olet KOLEHTI-sovelluksen AI Coach. Arvioi käyttäjän rahatarpeen perustelu reilusti, empaattisesti ja tiiviisti. Vastaa vain JSON-muodossa: score number 0-100, ai_score number, ai_quality number, ai_need number, ai_clarity number, ai_risk number, label string, tip string, rewrite string. Älä lupaa voittoa. Älä kannusta valehtelemaan. Suosi konkreettisuutta, selkeyttä, uskottavuutta ja yhteisöllistä vaikutusta.",
          },
          {
            role: "user",
            content: clean,
          },
        ],
      }),
    });

    if (!response.ok) {
      return res.status(200).json(fallback(clean));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    try {
      const parsed = JSON.parse(content);
      return res.status(200).json({
        ...fallback(clean),
        ...parsed,
        score: Math.max(0, Math.min(100, Number(parsed.score || parsed.ai_score || 70))),
      });
    } catch {
      return res.status(200).json(fallback(clean));
    }
  } catch {
    return res.status(200).json(fallback(req.body?.text || ""));
  }
}
