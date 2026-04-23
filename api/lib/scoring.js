function fallbackScore(text = "") {
  const lower = text.toLowerCase();
  const clarity = text.length > 60 ? 0.8 : 0.55;
  const authenticity = /(tarvitsen|auttaisi|selviäisin|vaikea)/.test(lower) ? 0.82 : 0.62;
  const need = /(vuokra|lasku|ruoka|sähkö|bensa|lääke|lapsi|opiskelu)/.test(lower) ? 0.92 : 0.65;
  const specificity = /\d|€|euro/.test(lower) ? 0.9 : 0.6;
  const impact = /(stressi|huoli|yksin|pakko|apu)/.test(lower) ? 0.82 : 0.6;
  const ai_score = 0.2 * clarity + 0.2 * authenticity + 0.25 * need + 0.2 * specificity + 0.15 * impact;
  return {
    ai_score: Number(ai_score.toFixed(3)),
    clarity, authenticity, need, specificity, impact, model_used: "fallback-heuristic",
  };
}

export async function calculateAIScore(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  if (!apiKey) return fallbackScore(text);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: [{ type: "input_text", text: "Arvioi suomenkielinen perustelu rahallisen tuen tarpeesta. Palauta vain JSON skeeman mukaan." }] },
          { role: "user", content: [{ type: "input_text", text }] }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "kolehti_scoring",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                clarity: { type: "number" },
                authenticity: { type: "number" },
                need: { type: "number" },
                specificity: { type: "number" },
                impact: { type: "number" },
                summary: { type: "string" }
              },
              required: ["clarity","authenticity","need","specificity","impact","summary"]
            }
          }
        }
      }),
    });
    const data = await response.json();
    const raw = data?.output?.[0]?.content?.[0]?.text || data?.output_text || null;
    if (!raw) return fallbackScore(text);
    const parsed = JSON.parse(raw);
    const ai_score = 0.2 * parsed.clarity + 0.2 * parsed.authenticity + 0.25 * parsed.need + 0.2 * parsed.specificity + 0.15 * parsed.impact;
    return { ...parsed, ai_score: Number(ai_score.toFixed(3)), model_used: model };
  } catch {
    return fallbackScore(text);
  }
}
