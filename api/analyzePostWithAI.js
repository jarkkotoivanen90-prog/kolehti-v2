export async function analyzePostWithAI(content) {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    const text = await res.text();

    if (!text) {
      return {
        ai_score: 50,
        feedback: "AI ei vastannut",
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        ai_score: 50,
        feedback: "Virhe AI vastauksessa",
      };
    }

    return data;
  } catch (err) {
    console.error(err);

    return {
      ai_score: 50,
      feedback: "AI error",
    };
  }
}
