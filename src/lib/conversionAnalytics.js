import { supabase } from "./supabaseClient";

export async function trackConversionEvent(eventType, meta = {}) {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) return;

    await supabase.from("user_events").insert({
      user_id: userId,
      event_type: eventType,
      source: "conversion",
      meta,
    });
  } catch (error) {
    console.warn("conversion analytics skipped", error?.message || error);
  }
}

export function getConversionBadge({ rank = 10, gap = null, supportScore = 0, timeLeftMs = 86400000 } = {}) {
  if (timeLeftMs <= 2 * 60 * 60 * 1000) return "🔥 Viime hetket";
  if (rank === 1) return "💎 Eniten tuettu";
  if (rank <= 3 && (gap === null || gap <= 120)) return "🚀 Nousemassa kärkeen";
  if (supportScore >= 250) return "❤️ Yhteisö tukee";
  return "✨ Tue hyvää perustelua";
}

export function getSupportGapText(gap) {
  if (gap === null || gap === undefined) return "Kerää ensimmäiset tukipisteet";
  if (gap <= 20) return `Vain ${gap} pistettä kärkeen`;
  if (gap <= 120) return `${gap} pistettä kärkeen`;
  return "Tuki nostaa näkyvyyttä yhteisössä";
}
