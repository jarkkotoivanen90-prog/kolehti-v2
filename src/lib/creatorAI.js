export async function improvePost(text) {
  try {
    const res = await fetch("/api/creator-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    return data;
  } catch (e) {
    return {
      improved: text,
      tips: ["AI ei saatavilla"]
    };
  }
}
