export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, text } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Missing type" });
    }

    // 🔹 LOCAL fallback (no OpenAI needed)
    const clean = String(text || "").trim();

    // =========================
    // 🧠 ANALYZE (score)
    // =========================
    if (type === "analyze") {
      const lengthScore = Math.min(35, Math.round(clean.length / 12));
      const clarityScore =
        /koska|siksi|tarvitsen|auttaa|tukea|yhdessä/i.test(clean) ? 25 : 10;
      const structureScore = /[.!?]/.test(clean) ? 20 : 10;
      const emotionScore =
        /kiitos|toivo|apua|perhe|ystävä|yhteisö/i.test(clean) ? 20 : 10;

      const score = Math.max(
        35,
        Math.min(100, lengthScore + clarityScore + structureScore + emotionScore)
      );

      return res.status(200).json({
        score,
        label:
          score >= 80
            ? "Vahva perustelu"
            : score >= 60
            ? "Hyvä alku"
            : "Paranna vielä",
        tip:
          score >= 80
            ? "Tämä on selkeä ja uskottava perustelu."
            : "Lisää yksi konkreettinen syy miksi juuri sinua pitäisi tukea.",
      });
    }

    // =========================
    // ✍️ MENTOR (paranna tekstiä)
    // =========================
    if (type === "mentor") {
      if (!clean) {
        return res.status(200).json({ result: "" });
      }

      const improved =
        clean +
        " Tämä ei ole vain minua varten, vaan sillä olisi vaikutusta myös ympärilläni oleviin ihmisiin.";

      return res.status(200).json({
        result: improved,
      });
    }

    // =========================
    // 🎯 SLOGAN
    // =========================
    if (type === "slogan") {
      const slogan = clean
        ? `"${clean.slice(0, 60)}..."`
        : "Yksi hyvä syy voi muuttaa kaiken.";

      return res.status(200).json({
        result: slogan,
      });
    }

    // =========================
    // 🚀 CREATOR MODE
    // =========================
    if (type === "creator") {
      return res.status(200).json({
        result:
          "Kirjoita henkilökohtaisesti, lisää konkreettinen tavoite ja yksi tunne-elementti — se lisää voittomahdollisuuksia.",
      });
    }

    return res.status(400).json({ error: "Unknown type" });
  } catch (err) {
    return res.status(500).json({
      error: err.message || "AI error",
    });
  }
}
