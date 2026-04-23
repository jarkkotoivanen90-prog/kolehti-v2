export async function track(event, data = {}) {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data, ts: Date.now() }),
    });
  } catch {
    // no-op
  }
}
