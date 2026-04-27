import { supabase } from "./supabaseClient";

export function getBoostSignal(post = {}) {
  const votes = Number(post.vote_count || post.votes || 0);
  const ai = Number(post.ai_score || 0);
  const boost = Number(post.boost_score || 0);

  if (votes >= 10) return { label: "HOT", bonus: 120 };
  if (votes >= 5) return { label: "RISING", bonus: 70 };
  if (ai >= 85) return { label: "QUALITY", bonus: 60 };
  if (boost >= 50) return { label: "BOOST", bonus: 80 };
  return { label: "NORMAL", bonus: 0 };
}

export async function recordBoostSignal(userId, post) {
  if (!post?.id) return;
  const signal = getBoostSignal(post);
  if (!signal.bonus) return;

  await supabase.from("growth_events").insert({
    user_id: userId || null,
    event_type: "boost_signal",
    source: "feed",
    points: signal.bonus,
    meta: {
      post_id: post.id,
      label: signal.label,
      bonus: signal.bonus,
    },
  });
}
