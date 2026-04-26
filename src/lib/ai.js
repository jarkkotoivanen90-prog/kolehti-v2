export async function analyzePostWithAI(text) {
  try {
    const response = await fetch("/api/ai-analyze-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    let data = {};

    try {
      const raw = await response.text();
      data = raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error("JSON parse error:", error);
      data = {};
    }

    if (!response.ok) {
      return {
        ai_score: 50,
        score: 50,
        feedback: data.error || "AI-analyysi epäonnistui, käytetään varapisteytystä.",
      };
    }

    return {
      ai_score: data.ai_score ?? data.score ?? 50,
      score: data.score ?? data.ai_score ?? 50,
      ai_quality: data.ai_quality ?? 50,
      ai_need: data.ai_need ?? 50,
      ai_clarity: data.ai_clarity ?? 50,
      ai_risk: data.ai_risk ?? 0,
      summary: data.summary ?? "AI-analyysi valmis.",
      feedback: data.feedback ?? data.ai_feedback ?? data,
      raw: data,
    };
  } catch (error) {
    console.error("AI request failed:", error);

    return {
      ai_score: 50,
      score: 50,
      feedback: "AI-yhteys epäonnistui, käytetään varapisteytystä.",
    };
  }
}
