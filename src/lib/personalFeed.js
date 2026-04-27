import { supabase } from "./supabaseClient";

const DEFAULT_PREFS = {
  highNeed: 1,
  quality: 1,
  trending: 1,
  fresh: 1,
  botContent: 0.8,
  ownGroup: 1,
};

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function getPersonalFeedProfile(userId) {
  if (!userId) return DEFAULT_PREFS;

  const { data } = await supabase
    .from("growth_events")
    .select("event_type,meta,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(120);

  if (!data?.length) return DEFAULT_PREFS;

  const prefs = { ...DEFAULT_PREFS };

  for (const event of data) {
    const meta = event.meta || {};
    const type = event.event_type || "";
    const reason = String(meta.reason || "").toLowerCase();

    if (type.includes("vote") || type.includes("boost") || type.includes("share")) {
      if (reason.includes("tarve") || number(meta.ai_need, 0) >= 75) prefs.highNeed += 0.08;
      if (reason.includes("perustelu") || number(meta.ai_quality, 0) >= 75) prefs.quality += 0.08;
      if (reason.includes("trend") || number(meta.learning_boost, 1) > 1) prefs.trending += 0.08;
      if (meta.is_bot) prefs.botContent += 0.03;
      if (meta.group_match) prefs.ownGroup += 0.04;
    }

    if (type.includes("view") || type.includes("impression")) {
      if (reason.includes("uusi")) prefs.fresh += 0.02;
      if (meta.is_bot) prefs.botContent += 0.01;
    }
  }

  return {
    highNeed: Math.min(1.8, prefs.highNeed),
    quality: Math.min(1.8, prefs.quality),
    trending: Math.min(1.8, prefs.trending),
    fresh: Math.min(1.5, prefs.fresh),
    botContent: Math.min(1.2, prefs.botContent),
    ownGroup: Math.min(1.4, prefs.ownGroup),
  };
}

export function calculatePersonalBoost(post = {}, prefs = DEFAULT_PREFS, context = {}) {
  let boost = 1;

  if (number(post.ai_need, 0) >= 75) boost *= prefs.highNeed;
  if (number(post.ai_quality, 0) >= 75) boost *= prefs.quality;
  if (number(post.learning_boost, 1) > 1) boost *= prefs.trending;
  if (post.is_bot) boost *= prefs.botContent;
  if (context.groupId && post.group_id === context.groupId) boost *= prefs.ownGroup;

  return Math.max(0.7, Math.min(2.2, boost));
}
