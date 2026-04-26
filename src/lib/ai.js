export async function analyzePostWithAI(text) {
  try {
    const response = await fetch("/api/ai-analyze-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const raw = await response.text();

    if (!raw) {
      return {
        ai_score: 50,
        score: 50,
        feedback: "AI ei vastannut, käytetään varapisteytystä.",
      };
    }

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return {
        ai_score: 50,
        score: 50,
        feedback: "AI-vastaus ei ollut JSON-muodossa.",
      };
    }

    if (!response.ok) {
      return {
        ai_score: 50,
        score: 50,
        feedback: data.error || "AI-analyysi epäonnistui.",
      };
    }

    return {
      ...data,
      ai_score: data.ai_score ?? data.score ?? 50,
      score: data.score ?? data.ai_score ?? 50,
      feedback: data.feedback ?? data.ai_feedback ?? data,
    };
  } catch (error) {
    return {
      ai_score: 50,
      score: 50,
      feedback: "AI-yhteys epäonnistui, käytetään varapisteytystä.",
    };
  }
}
