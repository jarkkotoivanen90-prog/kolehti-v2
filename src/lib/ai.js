export async function analyzePostWithAI(text) {
  const response = await fetch("/api/ai-analyze-post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "AI-analyysi epäonnistui.");
  }

  return data;
}
